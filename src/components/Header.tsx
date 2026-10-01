import { MapPin, Monitor, Sun, Moon, Check, Share2, Info } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import { setThemePreference } from "../theme";
import type { Theme, ThemePreference } from "../theme";
import { Button, Popover, Dialog } from "../ui";
const themeLabels = { system: "système", light: "clair", dark: "sombre" };
const nextTheme: Record<ThemePreference, ThemePreference> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const places = [
  { name: "Rue Ninau", center: [1.44954, 43.597678] as [number, number], zoom: 17.3 },
  { name: "Saint-Étienne", center: [1.448962, 43.599782] as [number, number], zoom: 17 },
  { name: "Saintes-Scarbes", center: [1.448734, 43.598128] as [number, number], zoom: 18 },
  { name: "Montoulieu", center: [1.450186, 43.596732] as [number, number], zoom: 17.5 },
  { name: "Saint-Cyprien", center: [1.4315, 43.599] as [number, number], zoom: 15.6 },
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
          <Button
            type="button"
            className="header-icon theme-toggle"
            aria-label={`Thème : ${themeLabels[themePreference]}. Passer au thème ${themeLabels[nextTheme[themePreference]]}`}
            data-tooltip={`Thème : ${themeLabels[themePreference]}. Passer au thème ${themeLabels[nextTheme[themePreference]]}`}
            onClick={() => setThemePreference(nextTheme[themePreference])}
          >
            {themePreference === "system" ? (
              <Monitor size={18} aria-hidden="true" />
            ) : themePreference === "light" ? (
              <Sun size={18} aria-hidden="true" />
            ) : (
              <Moon size={18} aria-hidden="true" />
            )}
          </Button>
          <span className="sr-only" role="status">
            Thème : {themeLabels[themePreference]}
            {themePreference === "system" ? ` (${themeLabels[theme]})` : ""}
          </span>
          <Popover
            open={placesOpen}
            onOpenChange={onPlacesOpenChange}
            label="Choisir un lieu"
            closeLabel="Fermer le choix du lieu"
            className="places-popover"
            align="end"
            trigger={
              <Button className="places-button" data-tooltip="Aller à un lieu">
                <MapPin size={17} />
                Lieux
              </Button>
            }
          >
            <select
              aria-label="Aller à un lieu"
              defaultValue=""
              onChange={(event) => {
                onPlace(places[Number(event.target.value)]);
                onPlacesOpenChange(false);
              }}
            >
              <option value="" disabled>
                Choisir un lieu
              </option>
              {places.map((place, index) => (
                <option key={place.name} value={index}>
                  {place.name}
                </option>
              ))}
            </select>
          </Popover>
          <Button
            className="header-icon"
            onClick={share}
            aria-label="Partager la vue"
            data-tooltip={copied ? "Lien copié" : "Partager la vue"}
          >
            {copied ? <Check size={17} /> : <Share2 size={17} />}
          </Button>
          {copied && (
            <span className="sr-only" aria-live="polite">
              Lien copié
            </span>
          )}
          <Button
            className="source-button header-icon"
            onClick={onSources}
            aria-label="À propos des cartes"
            data-tooltip="À propos des cartes"
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
        label="Partager la vue"
        closeLabel="Fermer le partage"
        className="share-modal"
      >
        <h2>Partager la vue</h2>
        <p>Copiez ce lien pour retrouver cette vue de la carte.</p>
        <input
          readOnly
          aria-label="Lien de partage"
          value={shareFallback}
          onFocus={(e) => e.currentTarget.select()}
        />
      </Dialog>
    </>
  );
}
