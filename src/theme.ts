import { useSyncExternalStore } from "react";

export { modernMapStyle } from "./map/styles";

export type ThemePreference = "system" | "light" | "dark";
export type Theme = "light" | "dark";
const storageKey = "retrolosa-theme";
const changed = "retrolosa-theme-change";
const media = window.matchMedia("(prefers-color-scheme: dark)");

export function appliedTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function preference(): ThemePreference {
  const value = document.documentElement.dataset.themePreference;
  return value === "dark" || value === "light" ? value : "system";
}

function apply(value: ThemePreference) {
  const theme = value === "system" ? (media.matches ? "dark" : "light") : value;
  document.documentElement.dataset.themePreference = value;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#171f1c" : "#efece3");
}

export function setThemePreference(value: ThemePreference) {
  apply(value);
  try {
    localStorage.setItem(storageKey, value);
  } catch {
    // Keep the selection for this page when storage is unavailable.
  }
  window.dispatchEvent(new Event(changed));
}

function subscribe(notify: () => void) {
  const systemChanged = () => {
    apply(preference());
    notify();
  };
  const storageChanged = (event: StorageEvent) => {
    if (event.key !== storageKey && event.key !== null) return;
    apply(event.newValue === "light" || event.newValue === "dark" ? event.newValue : "system");
    notify();
  };
  media.addEventListener("change", systemChanged);
  window.addEventListener(changed, notify);
  window.addEventListener("storage", storageChanged);
  return () => {
    media.removeEventListener("change", systemChanged);
    window.removeEventListener(changed, notify);
    window.removeEventListener("storage", storageChanged);
  };
}

function snapshot() {
  return `${preference()}:${appliedTheme()}`;
}

export function useTheme() {
  const value = useSyncExternalStore(subscribe, snapshot);
  const [selection, theme] = value.split(":") as [ThemePreference, Theme];
  return { selection, theme };
}
