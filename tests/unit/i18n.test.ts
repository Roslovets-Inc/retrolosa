import { createInstance } from "i18next";
import { describe, expect, it } from "vitest";

import { CITY_EVENTS } from "../../src/city-events";
import { EPOCH_IDS, getEpoch } from "../../src/epochs/catalog";
import { getEpochDetails } from "../../src/epochs/details";
import { translateLabel } from "../../src/i18n-labels";
import en from "../../src/locales/en.json";
import fr from "../../src/locales/fr.json";
import ru from "../../src/locales/ru.json";
import sourcesEn from "../../src/locales/sources-en.json";
import sourcesFr from "../../src/locales/sources-fr.json";
import sourcesRu from "../../src/locales/sources-ru.json";

describe("translation resources", () => {
  for (const [name, english, translated] of [
    ["interface", en, fr],
    ["sources", sourcesEn, sourcesFr],
    ["Russian interface", en, ru],
    ["Russian sources", sourcesEn, sourcesRu],
  ] as const) {
    it(`${name} has matching keys and interpolation variables`, () => {
      expect(Object.keys(english).sort()).toEqual(Object.keys(translated).sort());
      const translatedStrings: Record<string, string> = translated;
      for (const [key, text] of Object.entries(english)) {
        const placeholders = (value: string) => value.match(/\{\{\w+\}\}/g)?.sort() ?? [];
        expect(text.trim(), key).not.toBe("");
        expect(translatedStrings[key].trim(), key).not.toBe("");
        expect(placeholders(text), key).toEqual(placeholders(translatedStrings[key]));
        expect(text.match(/<\/?\w+\s*\/?>/g) ?? [], key).toEqual(
          translatedStrings[key].match(/<\/?\w+\s*\/?>/g) ?? [],
        );
      }
    });
  }

  it("localizes catalogue labels, timeline transitions and every milestone", async () => {
    const i18n = createInstance();
    await i18n.init({ lng: "en", keySeparator: false, resources: { en: { translation: en } } });
    expect(translateLabel(i18n.t, "XIIe → Actuel")).toBe("12th c. → Present");
    expect(translateLabel(i18n.t, "XIIIe · Reconstruction")).toBe("13th c. · Reconstruction");
    for (const id of EPOCH_IDS) {
      const epoch = getEpoch(id);
      for (const label of [epoch.label, epoch.optionLabel, epoch.category, epoch.timelineLabel]) {
        if (label && !/^\d+$/.test(label)) expect(i18n.exists(`terms.${label}`), label).toBe(true);
      }
    }
    for (const event of CITY_EVENTS) {
      expect(i18n.exists(`events.${event.year}.title`)).toBe(true);
      expect(i18n.exists(`events.${event.year}.text`)).toBe(true);
    }
  });

  for (const language of ["en", "ru"] as const)
    it(`translates every source into ${language} with metadata values and retains document links`, async () => {
      const i18n = createInstance();
      await i18n.init({
        lng: language,
        keySeparator: false,
        defaultNS: "sources",
        resources: {
          en: { sources: sourcesEn },
          fr: { sources: sourcesFr },
          ru: { sources: sourcesRu },
        },
      });
      for (const id of EPOCH_IDS) {
        const original = getEpochDetails(id);
        const localized = getEpochDetails(id, (key, defaultValue, values) => {
          expect(i18n.exists(key), key).toBe(true);
          return i18n.t(key, { defaultValue, ...values });
        });
        expect(localized.paragraphs).toHaveLength(original.paragraphs.length);
        expect(JSON.stringify(localized)).not.toContain("{{");
        expect(localized.links?.map(({ path, url }) => ({ path, url }))).toEqual(
          original.links?.map(({ path, url }) => ({ path, url })),
        );
      }
      await i18n.changeLanguage("fr");
      for (const id of EPOCH_IDS) {
        expect(
          getEpochDetails(id, (key, defaultValue, values) =>
            i18n.t(key, { defaultValue, ...values }),
          ),
        ).toEqual(getEpochDetails(id));
      }
    });
});
