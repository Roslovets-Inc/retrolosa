// Apply the saved appearance before the page paints.
(() => {
  let preference = "system";
  try {
    const saved = localStorage.getItem("retrolosa-theme");
    if (saved === "light" || saved === "dark") preference = saved;
  } catch {
    // Storage may be unavailable; the system preference still works.
  }
  const theme = preference === "system"
    ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : preference;
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]').content = theme === "dark" ? "#171f1c" : "#efece3";
})();
