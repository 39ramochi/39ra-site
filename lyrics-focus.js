/* Public MUSIC FOCUS lyrics reader. Private STUDIO lyric records are never read here. */
(() => {
  'use strict';

  const TRACK_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const LANGUAGE = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/;
  const MAX_TEXT_LENGTH = 20000;
  const CACHE_LIMIT = 4;

  const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const isNonEmptyString = value => typeof value === 'string' && value.trim().length > 0;

  function lyricReferenceFor(track) {
    if (!isPlainObject(track) || track.lyrics?.available !== true || !TRACK_ID.test(track.id || '')) return null;
    const expectedPath = `data/lyrics/${track.id}.json`;
    const { path, language, credit } = track.lyrics;
    if (path !== expectedPath || !isNonEmptyString(language) || !LANGUAGE.test(language) || !isNonEmptyString(credit)) return null;
    return { trackId: track.id, path, language, credit };
  }

  function lyricsUrlFor(track, baseURI = document.baseURI) {
    const reference = lyricReferenceFor(track);
    if (!reference) return null;
    try {
      return new URL(reference.path, baseURI).href;
    } catch {
      return null;
    }
  }

  function validateLyricsPayload(payload, trackId) {
    if (!isPlainObject(payload) || payload.schemaVersion !== 1 || payload.trackId !== trackId) return null;
    if (!isNonEmptyString(payload.text) || payload.text.length > MAX_TEXT_LENGTH) return null;
    if (!isNonEmptyString(payload.language) || !LANGUAGE.test(payload.language) || !isNonEmptyString(payload.credit)) return null;
    return { trackId: payload.trackId, text: payload.text, language: payload.language, credit: payload.credit };
  }

  // Editorial presentation only. The original lyric text is never modified or saved back.
  function lyricsTextForDisplay(text, trackTitle) {
    if (typeof text !== 'string' || typeof trackTitle !== 'string' || !trackTitle) return text;
    const boundary = text.search(/[\r\n]/);
    const firstLine = boundary === -1 ? text : text.slice(0, boundary);
    if (firstLine !== `# ${trackTitle}`) return text;
    if (boundary === -1) return '';
    let offset = boundary;
    if (text[offset] === '\r' && text[offset + 1] === '\n') offset += 2;
    else offset += 1;
    // An empty line immediately after a duplicate title is presentation spacing.
    if (text.slice(offset, offset + 2) === '\r\n') offset += 2;
    else if (text[offset] === '\r' || text[offset] === '\n') offset += 1;
    return text.slice(offset);
  }

  function renderEditorialLyrics(body, sourceText, trackTitle) {
    const text = lyricsTextForDisplay(sourceText, trackTitle);
    const doc = body.ownerDocument || document;
    const fragment = doc.createDocumentFragment();
    // Capturing line breaks preserves the text exactly, including CRLF and blank lines.
    const parts = text.split(/(\r\n|\n|\r)/);
    parts.forEach((part, index) => {
      if (index % 2 === 0 && /^\[[^\[\]\r\n]{1,160}\]$/.test(part)) {
        const section = doc.createElement('span');
        section.className = 'music-focus-lyrics-section';
        section.textContent = part;
        fragment.appendChild(section);
      } else if (part) {
        fragment.appendChild(doc.createTextNode(part));
      }
    });
    body.replaceChildren(fragment);
    return text;
  }

  function createFocusLyricsController(options) {
    const { button, panel, closeButton, retryButton, status, credit, body, getTrack, getActiveTrackId } = options;
    const cache = new Map();
    let request = null;
    let requestId = 0;

    function setStatus(message, state) {
      panel.dataset.state = state;
      panel.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
      status.textContent = message || '';
    }

    function abortRequest() {
      requestId += 1;
      if (request) request.abort();
      request = null;
    }

    function renderLyrics(record) {
      const activeTrack = getTrack();
      const trackTitle = activeTrack?.id === record.trackId ? activeTrack.title : null;
      renderEditorialLyrics(body, record.text, trackTitle);
      credit.textContent = `LYRICS / ${record.credit}`;
      retryButton.hidden = true;
      setStatus('', 'ready');
    }

    function hidePanel({ restoreFocus = false } = {}) {
      abortRequest();
      panel.hidden = true;
      panel.setAttribute('aria-hidden', 'true');
      button.setAttribute('aria-expanded', 'false');
      retryButton.hidden = true;
      setStatus('', 'idle');
      if (restoreFocus) button.focus({ preventScroll: true });
    }

    function prepare(track) {
      abortRequest();
      hidePanel();
      body.textContent = '';
      credit.textContent = '';
      const reference = lyricReferenceFor(track);
      button.hidden = !reference;
      button.setAttribute('aria-expanded', 'false');
      return Boolean(reference);
    }

    function remember(record) {
      cache.delete(record.trackId);
      cache.set(record.trackId, record);
      while (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value);
    }

    async function open() {
      const track = getTrack();
      const reference = lyricReferenceFor(track);
      const url = lyricsUrlFor(track);
      if (!reference || !url) return;

      panel.hidden = false;
      panel.setAttribute('aria-hidden', 'false');
      button.setAttribute('aria-expanded', 'true');
      const cached = cache.get(reference.trackId);
      if (cached) {
        renderLyrics(cached);
        return;
      }
      if (request) return;

      const token = ++requestId;
      request = new AbortController();
      retryButton.hidden = true;
      body.textContent = '';
      credit.textContent = '';
      setStatus('LYRICS を読み込んでいます…', 'loading');
      try {
        const response = await fetch(url, { signal: request.signal, headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error('lyrics-unavailable');
        const record = validateLyricsPayload(await response.json(), reference.trackId);
        if (!record) throw new Error('lyrics-invalid');
        if (token !== requestId || getActiveTrackId() !== reference.trackId) return;
        remember(record);
        renderLyrics(record);
      } catch (error) {
        if (error?.name === 'AbortError' || token !== requestId || getActiveTrackId() !== reference.trackId) return;
        body.textContent = '';
        credit.textContent = '';
        retryButton.hidden = false;
        setStatus('LYRICS を読み込めませんでした。再試行してください。', 'error');
      } finally {
        if (token === requestId) request = null;
      }
    }

    button.addEventListener('click', () => {
      if (panel.hidden) void open();
      else hidePanel({ restoreFocus: true });
    });
    closeButton.addEventListener('click', () => hidePanel({ restoreFocus: true }));
    retryButton.addEventListener('click', () => {
      abortRequest();
      void open();
    });

    return {
      prepare,
      reset: () => prepare(null),
      open,
      close: hidePanel,
      handleEscape: () => {
        if (panel.hidden) return false;
        hidePanel({ restoreFocus: true });
        return true;
      },
      cacheSize: () => cache.size
    };
  }

  window.LyricsFocus = { createFocusLyricsController, lyricReferenceFor, lyricsUrlFor, validateLyricsPayload, lyricsTextForDisplay, renderEditorialLyrics };
})();
