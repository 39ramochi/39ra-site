(() => {
  'use strict';
  const interlude = document.getElementById('gardenRadioInterlude');
  if (!interlude || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

  document.body.classList.add('garden-radio-motion-ready');
  try {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        interlude.classList.add('is-revealed');
        observer.disconnect();
        break;
      }
    }, { threshold: 0.28 });
    observer.observe(interlude);
  } catch (_) {
    document.body.classList.remove('garden-radio-motion-ready');
    interlude.classList.add('is-revealed');
  }
})();
