/* Apply before styles load to avoid a light flash on dark devices. */
(() => {
  const media = matchMedia('(prefers-color-scheme: dark)');
  let preference = 'system';
  try { preference = localStorage.getItem('qfk_theme') || 'system'; } catch (_) {}
  const valid = value => ['light', 'dark', 'system'].includes(value) ? value : 'system';
  function apply(value) {
    preference = valid(value);
    const theme = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#191a20' : '#8A1538');
    const select = document.getElementById('themeSelect');
    if (select) select.value = preference;
  }
  window.QFKTheme = {get: () => preference, set: value => {
    apply(value);
    try { localStorage.setItem('qfk_theme', preference); } catch (_) {}
  }};
  apply(preference);
  media.addEventListener('change', () => { if (preference === 'system') apply('system'); });
  window.addEventListener('storage', e => { if (e.key === 'qfk_theme' || e.key === null) apply(e.newValue || 'system'); });
})();
