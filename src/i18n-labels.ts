import type { TFunction } from "i18next";

/** Localize catalogue labels at the UI boundary without changing map/view state. */
export function translateLabel(t: TFunction, value: string): string {
  return value
    .split(" → ")
    .map((part) => {
      const translated = t(`terms.${part}`, { ns: "translation", defaultValue: part });
      if (translated !== part) return translated;
      return part
        .split(" · ")
        .map((label) => t(`terms.${label}`, { ns: "translation", defaultValue: label }))
        .join(" · ");
    })
    .join(" → ");
}
