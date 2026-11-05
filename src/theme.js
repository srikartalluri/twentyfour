export function initTheme() {
  const root = document.documentElement;
  const button = document.querySelector('#theme-toggle');
  const label = document.querySelector('#theme-label');
  const browserColor = document.querySelector('meta[name="theme-color"]');
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference;
  try { preference = localStorage.getItem('twentyfour-theme'); } catch {}
  if (preference !== 'light' && preference !== 'dark') preference = null;

  function apply(theme) {
    const dark = theme === 'dark';
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} mode`);
    label.textContent = dark ? 'Light mode' : 'Dark mode';
    browserColor.content = dark ? '#18191b' : '#f7f8f4';
  }

  function toggle() {
    preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
    apply(preference);
    try { localStorage.setItem('twentyfour-theme', preference); } catch {}
  }

  function systemChanged(event) {
    if (!preference) apply(event.matches ? 'dark' : 'light');
  }

  function preferenceChanged(event) {
    if (event.key !== 'twentyfour-theme' && event.key !== null) return;
    preference = event.newValue === 'light' || event.newValue === 'dark' ? event.newValue : null;
    apply(preference ?? (system.matches ? 'dark' : 'light'));
  }

  apply(preference ?? (system.matches ? 'dark' : 'light'));
  button.addEventListener('click', toggle);
  system.addEventListener('change', systemChanged);
  window.addEventListener('storage', preferenceChanged);

  return () => {
    button.removeEventListener('click', toggle);
    system.removeEventListener('change', systemChanged);
    window.removeEventListener('storage', preferenceChanged);
  };
}
