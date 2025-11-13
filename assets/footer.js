(async () => {
  const target = document.getElementById('credit-line');
  if (!target) return;

  const pickLine = (text) => {
    const lines = text.split(/\r?\n/)
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('#') && !s.startsWith('//') && !/^<\/?html/i.test(s));
    if (!lines.length) return null;
    return lines[Math.floor(Math.random() * lines.length)];
  };

  const tryFetch = async (url) => {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP '+res.status);
    return await res.text();
  };

  const local = '/assets/splash.txt';
  const remote = 'https://filehost.lachlanm05.com/website/credits.txt';

  try {
    const text = await tryFetch(local);
    const line = pickLine(text) || 'Made with love, and HTML.';
    target.textContent = line;
  } catch (e1) {
    try {
      const text = await tryFetch(remote);
      const line = pickLine(text) || 'Made with love, and HTML.';
      target.textContent = line;
    } catch (e2) {
      target.textContent = 'Made with love, and HTML.';
    }
  }
})();