/* CONTACT is configuration-only in this trial. Leave values empty until official destinations are approved. */
window.ContactConfig = Object.freeze({
  socialUrl: 'https://x.com/moz4869',
  email: '',
  categories: Object.freeze([
    Object.freeze({
      id: 'feedback', number: '01', label: 'FEEDBACK & SOCIAL', japanese: '感想・交流', channel: 'social',
      subject: '【39ra】感想・交流',
      description: '作品への感想やメッセージはフォームから送信できます。活動情報や気軽な交流は、Xでもご確認いただけます。'
    }),
    Object.freeze({
      id: 'collaboration', number: '02', label: 'COLLABORATION', japanese: '制作依頼・コラボレーション', channel: 'email',
      subject: '【39ra】制作・コラボレーションのご相談',
      description: '制作依頼、コラボレーションのご相談はこちらです。',
      template: '39ra 様\n\n制作・コラボレーションについてご相談です。\n\n【ご相談内容】\n\n【制作内容・イメージ（任意）】\n\n【希望時期（任意）】\n\n【お名前／活動名（任意）】'
    }),
    Object.freeze({
      id: 'licensing', number: '03', label: 'MUSIC USAGE', japanese: '楽曲の利用について', channel: 'email',
      subject: '【39ra】楽曲利用のご相談',
      description: '使用条件や権利関係を確認するため、必要事項を添えてご連絡ください。',
      template: '39ra 様\n\n楽曲の利用についてご相談です。\n\n【対象楽曲・URL】\n\n【利用用途・媒体】\n\n【公開予定時期（任意）】\n\n【お名前／活動名（任意）】'
    }),
    Object.freeze({
      id: 'general', number: '04', label: 'GENERAL INQUIRIES', japanese: 'その他のお問い合わせ', channel: 'email',
      subject: '【39ra】その他のお問い合わせ',
      description: '上記以外のお問い合わせはこちらです。',
      template: '39ra 様\n\nお問い合わせいたします。\n\n【お問い合わせ内容】\n\n【お名前／活動名（任意）】'
    })
  ])
});
