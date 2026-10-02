import {
  ChevronDown,
  Languages,
  MapPin,
  Contrast,
  Sun,
  Moon,
  Check,
  Share2,
  Info,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { selectLanguage } from "../i18n";
import { translateLabel } from "../i18n-labels";
import { setThemePreference } from "../theme";
import type { Theme, ThemePreference } from "../theme";
import { Button, DropdownMenu, Dialog, Select } from "../ui";
import { InstallApp } from "./InstallApp";

const nextTheme: Record<ThemePreference, ThemePreference> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const places = [
  { name: "Place du Capitole", center: [1.443395, 43.604341] as [number, number], zoom: 16.5 },
  { name: "Basilique Saint-Sernin", center: [1.441917, 43.608458] as [number, number], zoom: 16.5 },
  { name: "Couvent des Jacobins", center: [1.44011, 43.603816] as [number, number], zoom: 17 },
  { name: "Saint-Étienne", center: [1.448962, 43.599782] as [number, number], zoom: 17 },
  { name: "Pont Neuf", center: [1.440401, 43.599588] as [number, number], zoom: 16 },
  { name: "Dôme de la Grave", center: [1.432892, 43.600841] as [number, number], zoom: 16.5 },
  { name: "Tout le centre", center: [1.442, 43.602] as [number, number], zoom: 15 },
];

export type Place = (typeof places)[number];
export function Header({
  theme,
  themePreference,
  placesOpen,
  onPlacesOpenChange,
  onSources,
  onPlace,
  createShareUrl,
}: {
  theme: Theme;
  themePreference: ThemePreference;
  placesOpen: boolean;
  onPlacesOpenChange: (open: boolean) => void;
  onSources: () => void;
  onPlace: (place: Place) => void;
  createShareUrl: () => URL;
}) {
  const { t, i18n } = useTranslation();
  const themeLabels = {
    system: translateLabel(t, "système"),
    light: translateLabel(t, "clair"),
    dark: translateLabel(t, "sombre"),
  };
  const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;
  const [copied, setCopied] = useState(false);
  const [shareFallback, setShareFallback] = useState("");
  const copyTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (copyTimer.current !== null) clearTimeout(copyTimer.current);
    },
    [],
  );
  const share = async () => {
    const url = createShareUrl();
    setShareFallback("");
    if (navigator.share) {
      try {
        await navigator.share({ title: "Rétrolosa", url: url.href });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url.href);
      setCopied(true);
      if (copyTimer.current !== null) clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setShareFallback(url.href);
    }
  };

  return (
    <>
      <header className="masthead">
        <a className="brand" href={import.meta.env.BASE_URL} aria-label="Rétrolosa">
          <img className="brand-mark" src={assetUrl("favicon.svg")} width="26" height="26" alt="" />
          <span>Rétrolosa</span>
        </a>
        <div className="header-right">
          <div className="language-selector">
            <Languages size={16} aria-hidden="true" />
            <Select
              label={t("language")}
              value={i18n.resolvedLanguage ?? "en"}
              onValueChange={(value) => selectLanguage(value as "en" | "fr")}
              options={[
                { value: "en", label: "English", lang: "en" },
                { value: "fr", label: "Français", lang: "fr" },
              ]}
            />
          </div>
          <DropdownMenu
            open={placesOpen}
            onOpenChange={onPlacesOpenChange}
            label={t("header.chooseAPlace")}
            trigger={
              <Button className="places-button" aria-label={t("header.places")}>
                <MapPin size={17} aria-hidden="true" />
                <span className="places-label">{t("header.places")}</span>
                <ChevronDown size={14} aria-hidden="true" />
              </Button>
            }
            options={places.map((place) => ({
              id: place.name,
              label: translateLabel(t, place.name),
              onSelect: () => onPlace(place),
            }))}
          />
          <Button
            type="button"
            className="header-icon theme-toggle"
            aria-label={t("header.themeSwitchToTheme", {
              v0: themeLabels[themePreference],
              v1: themeLabels[nextTheme[themePreference]],
            })}
            data-tooltip={t("header.themeSwitchToTheme", {
              v0: themeLabels[themePreference],
              v1: themeLabels[nextTheme[themePreference]],
            })}
            onClick={() => setThemePreference(nextTheme[themePreference])}
          >
            {themePreference === "system" ? (
              <Contrast size={18} aria-hidden="true" />
            ) : themePreference === "light" ? (
              <Sun size={18} aria-hidden="true" />
            ) : (
              <Moon size={18} aria-hidden="true" />
            )}
          </Button>
          <span className="sr-only" role="status">
            {t("header.theme")} {themeLabels[themePreference]}
            {themePreference === "system" ? ` (${themeLabels[theme]})` : ""}
          </span>
          <Button
            className="header-icon"
            onClick={share}
            aria-label={t("header.shareThisView")}
            data-tooltip={copied ? t("header.linkCopied") : t("header.shareThisView")}
          >
            {copied ? <Check size={17} /> : <Share2 size={17} />}
          </Button>
          {copied && (
            <span className="sr-only" aria-live="polite">
              {t("header.linkCopied")}{" "}
            </span>
          )}
          <InstallApp />
          <Button
            className="source-button header-icon"
            onClick={onSources}
            aria-label={t("header.aboutTheMaps")}
            data-tooltip={t("header.aboutTheMaps")}
          >
            <Info size={18} />
          </Button>
        </div>
      </header>
      <Dialog
        open={Boolean(shareFallback)}
        onOpenChange={(open) => {
          if (!open) setShareFallback("");
        }}
        label={t("header.shareThisView")}
        closeLabel={t("header.closeSharing")}
        className="share-modal"
      >
        <h2>{t("header.shareThisView")}</h2>
        <p>{t("header.copyThisLinkToReturnToThisMapView")}</p>
        <input
          readOnly
          aria-label={t("header.shareLink")}
          value={shareFallback}
          onFocus={(e) => e.currentTarget.select()}
        />
      </Dialog>
    </>
  );
}
