import type { Theme } from "../theme";

export function modernMapStyle(theme: Theme) {
  return `https://tiles.openfreemap.org/styles/${theme === "dark" ? "dark" : "positron"}`;
}
