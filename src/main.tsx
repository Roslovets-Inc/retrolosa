import {
  ArrowLeftRight,
  Layers,
  Blend,
  MapPin,
  Plus,
  Minus,
  RotateCcw,
  Compass,
  Info,
  X,
  ExternalLink,
  Share2,
  Check,
  Navigation,
  Eye,
  Search,
  Monitor,
  Sun,
  Moon,
} from "lucide-react";
import React, { useEffect, useReducer, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import { CityWidget } from "./CityWidget";
import { EPOCH_IDS as YEARS, getEpoch } from "./epochs/catalog";
import type { EpochId as Year } from "./epochs/catalog";
import { Coordinates } from "./map/Coordinates";

import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";
import "./compact.css";
import "./ui.css";
import { useMaps } from "./map/useMaps";
import { nextBearing } from "./orientation";
import { setThemePreference, useTheme } from "./theme";
import type { ThemePreference } from "./theme";
import { snapTimelineYear, timelinePosition, timelineYear } from "./timeline";
import {
  Button,
  Checkbox,
  Dialog,
  Popover,
  Slider,
  Tooltip,
  TooltipProvider,
  ToggleGroup,
  ToggleItem,
} from "./ui";
import { useLocation } from "./useLocation";
import { derivePresentation } from "./view/presentation";
import {
  parseViewState,
  reduceViewState,
  serializeViewState,
  dateLabel as labelDate,
} from "./view/state";
import type { Mode, ViewState, ViewAction } from "./view/state";

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;
const themeLabels = { system: "système", light: "clair", dark: "sombre" };
const nextTheme: Record<ThemePreference, ThemePreference> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const TODAY = new Date().getFullYear();
const viewReducer = (state: ViewState, action: ViewAction) => reduceViewState(state, action, TODAY);
const epochLabel = (value: Year) => getEpoch(value).label;
const sourceUrl = (value: Year) => getEpoch(value).sourceUrl;
const mapCredit = (value: Year) => getEpoch(value).credit;
const dateLabel = (value: number) => labelDate(value, TODAY);
const places = [
  { name: "Rue Ninau", center: [1.44954, 43.597678] as [number, number], zoom: 17.3 },
  { name: "Saint-Étienne", center: [1.448962, 43.599782] as [number, number], zoom: 17 },
  { name: "Saintes-Scarbes", center: [1.448734, 43.598128] as [number, number], zoom: 18 },
  { name: "Montoulieu", center: [1.450186, 43.596732] as [number, number], zoom: 17.5 },
  { name: "Saint-Cyprien", center: [1.4315, 43.599] as [number, number], zoom: 15.6 },
  { name: "Tout le centre", center: [1.442, 43.602] as [number, number], zoom: 15 },
];
function App() {
  const { selection: themePreference, theme } = useTheme();
  const [initial] = useState(() => parseViewState(location.hash, TODAY));
  const [view, dispatch] = useReducer(viewReducer, initial.state);
  const { enabled, mode, time, opacity, split } = view;
  const setTime = (value: number) => dispatch({ type: "time", value });
  const setOpacity = (value: number) => dispatch({ type: "opacity", value });
  const setSplit = (value: number) => dispatch({ type: "split", value });
  const [epochsOpen, setEpochsOpen] = useState(false);
  const timelinePointer = useRef(false);
  const [compareHeld, setCompareHeld] = useState(false);
  const [loupe, setLoupe] = useState({ x: 50, y: 42 });
  const loupeDrag = useRef<{ id: number; x: number; y: number } | null>(null);
  const [peek, setPeek] = useState(false),
    [sources, setSources] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareFallback, setShareFallback] = useState("");
  const [placesOpen, setPlacesOpen] = useState(false);
  const presentation = derivePresentation(view, { compareHeld, peek }, TODAY);
  const {
    dates,
    year,
    timeLabel,
    visibleMode,
    populationYear,
    creditedPeriods,
    orientationEpoch,
    readingBearing,
    bearing,
    historicOpacity,
  } = presentation;
  const { controller, modernEl, oldEl, status } = useMaps(
    initial,
    theme,
    { enabled, time },
    TODAY,
    historicOpacity > 0,
    bearing,
  );
  const geo = useLocation(controller.locationMaps);
  const errors = [...new Set(status.failures.map((failure) => failure.message))];
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        !e.defaultPrevented &&
        !(
          e.target instanceof HTMLElement &&
          e.target.closest(
            'input, button, select, textarea, [role="slider"], [role="dialog"], [role="radio"], [contenteditable="true"]',
          )
        )
      ) {
        e.preventDefault();
        setPeek(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setPeek(false);
    };
    const blur = () => {
      setPeek(false);
      setCompareHeld(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);
  const timePosition = timelinePosition(time, dates);
  const moveTimeline = (element: HTMLInputElement, clientX: number) => {
    const box = element.getBoundingClientRect();
    const position = (clientX - box.left - 8) / Math.max(1, box.width - 16);
    setTime(snapTimelineYear(Math.round(timelineYear(position, dates)), dates));
  };
  const toggleEpoch = (id: Year) => dispatch({ type: "toggleEpoch", id });
  const loupeLeft = `clamp(var(--loupe-radius), ${loupe.x}%, calc(100% - var(--loupe-radius)))`;
  const loupeTop = `clamp(var(--loupe-radius), ${loupe.y}%, calc(100% - var(--loupe-radius)))`;
  const go = (index: number) =>
    controller.flyTo({ ...places[index], duration: 1000, essential: true });
  const share = async () => {
    const camera = { ...controller.getCamera(), bearing };
    const hash = serializeViewState(view, camera, year);
    const url = new URL(location.href);
    url.hash = hash;
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
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setShareFallback(url.href);
    }
  };
  return (
    <main tabIndex={-1}>
      <div className="map" ref={modernEl} aria-label="Carte actuelle de Toulouse" />
      <div
        className="map historic-map"
        ref={oldEl}
        aria-label="Cartes historiques sur la frise"
        style={{
          opacity: historicOpacity,
          clipPath:
            visibleMode === "split"
              ? `inset(0 ${100 - split}% 0 0)`
              : visibleMode === "loupe"
                ? `circle(var(--loupe-radius) at ${loupeLeft} ${loupeTop})`
                : "none",
        }}
      />
      {visibleMode === "loupe" && opacity > 0 && (
        <div className="map loupe-overlay">
          <Button
            className="loupe-glass"
            aria-label="Déplacer la loupe historique"
            aria-describedby="loupe-help"
            style={{ left: loupeLeft, top: loupeTop }}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              const rect = e.currentTarget.getBoundingClientRect();
              loupeDrag.current = {
                id: e.pointerId,
                x: e.clientX - rect.left - rect.width / 2,
                y: e.clientY - rect.top - rect.height / 2,
              };
              e.currentTarget.setPointerCapture(e.pointerId);
              e.currentTarget.focus({ preventScroll: true });
              e.preventDefault();
            }}
            onPointerMove={(e) => {
              const drag = loupeDrag.current;
              if (!drag || drag.id !== e.pointerId) return;
              const rect = e.currentTarget.parentElement!.getBoundingClientRect();
              const radius = e.currentTarget.offsetWidth / 2;
              setLoupe({
                x:
                  (Math.max(radius, Math.min(rect.width - radius, e.clientX - rect.left - drag.x)) /
                    rect.width) *
                  100,
                y:
                  (Math.max(radius, Math.min(rect.height - radius, e.clientY - rect.top - drag.y)) /
                    rect.height) *
                  100,
              });
            }}
            onPointerUp={() => {
              loupeDrag.current = null;
            }}
            onPointerCancel={() => {
              loupeDrag.current = null;
            }}
            onLostPointerCapture={() => {
              loupeDrag.current = null;
            }}
            onKeyDown={(e) => {
              const direction = {
                ArrowLeft: [-1, 0],
                ArrowRight: [1, 0],
                ArrowUp: [0, -1],
                ArrowDown: [0, 1],
              }[e.key];
              if (!direction) return;
              e.preventDefault();
              const rect = e.currentTarget.parentElement!.getBoundingClientRect();
              const radius = e.currentTarget.offsetWidth / 2;
              const step = e.shiftKey ? 40 : 10;
              setLoupe((position) => ({
                x:
                  (Math.max(
                    radius,
                    Math.min(
                      rect.width - radius,
                      (position.x / 100) * rect.width + direction[0] * step,
                    ),
                  ) /
                    rect.width) *
                  100,
                y:
                  (Math.max(
                    radius,
                    Math.min(
                      rect.height - radius,
                      (position.y / 100) * rect.height + direction[1] * step,
                    ),
                  ) /
                    rect.height) *
                  100,
              }));
            }}
          />
        </div>
      )}
      <header className="masthead">
        <a className="brand" href={import.meta.env.BASE_URL} aria-label="Rétrolosa">
          <Layers size={20} />
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
            onOpenChange={(open) => {
              setPlacesOpen(open);
              if (open) setEpochsOpen(false);
            }}
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
                go(Number(event.target.value));
                setPlacesOpen(false);
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
            onClick={() => setSources(true)}
            aria-label="À propos des cartes"
            data-tooltip="À propos des cartes"
          >
            <Info size={18} />
          </Button>
        </div>
      </header>
      <CityWidget
        year={populationYear}
        label={dateLabel(populationYear)}
        onSources={() => setSources(true)}
      />
      {visibleMode === "split" && opacity > 0 && (
        <>
          <div className="epoch-label old-label">
            {year === "1875" ? "1875 · Inondation" : epochLabel(year)}{" "}
            <span>{getEpoch(year).category}</span>
          </div>
          <div className="epoch-label new-label">
            <span>CARTE ACTUELLE</span> Actuel
          </div>
          <div className="divider" style={{ left: `${split}%` }}>
            <div
              className="divider-handle"
              role="slider"
              tabIndex={0}
              aria-label="Limite de comparaison"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(split)}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId))
                  setSplit(Math.max(0, Math.min(100, (e.clientX / window.innerWidth) * 100)));
              }}
              onKeyDown={(e) => {
                if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
                  e.preventDefault();
                  dispatch(
                    e.key === "Home" || e.key === "End"
                      ? { type: "split", value: e.key === "Home" ? 0 : 100 }
                      : { type: "moveSplit", delta: e.key === "ArrowLeft" ? -2 : 2 },
                  );
                }
              }}
            >
              <ArrowLeftRight size={21} />
            </div>
          </div>
        </>
      )}
      <div className="opacity-controls" role="group" aria-label="Transparence et comparaison">
        <Button
          className="compare-hold"
          tooltipSide="left"
          aria-label="Maintenir pour comparer avec la carte actuelle"
          aria-pressed={compareHeld}
          data-tooltip="Maintenez pour lire les rues actuelles"
          onPointerDown={(e) => {
            if (e.button !== 0 || !e.isPrimary) return;
            e.preventDefault();
            e.currentTarget.focus();
            e.currentTarget.setPointerCapture(e.pointerId);
            setCompareHeld(true);
          }}
          onPointerUp={() => setCompareHeld(false)}
          onPointerCancel={() => setCompareHeld(false)}
          onLostPointerCapture={() => setCompareHeld(false)}
          onBlur={() => setCompareHeld(false)}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              setCompareHeld(true);
            }
            if (e.key === "Escape") setCompareHeld(false);
          }}
          onKeyUp={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              setCompareHeld(false);
            }
          }}
        >
          <Eye size={20} />
        </Button>
        <section className="opacity-panel" aria-label="Opacité">
          <Slider
            value={opacity}
            onValueChange={setOpacity}
            label="Opacité de la carte historique"
            valueText={opacity === 0 ? "Carte actuelle" : `${opacity} %`}
            disabled={!enabled.length}
          />
          <output>{opacity}%</output>
        </section>
      </div>
      <div className="zoom-controls">
        <Button
          className={geo.status !== "off" ? "location-active" : ""}
          aria-label={geo.status === "off" ? "Me localiser" : "Désactiver la localisation"}
          tooltipSide="left"
          data-tooltip={geo.status === "off" ? "Me localiser" : "Désactiver la localisation"}
          aria-pressed={geo.status !== "off"}
          onClick={geo.toggle}
        >
          <Navigation size={19} fill={geo.status === "following" ? "currentColor" : "none"} />
        </Button>
        <div />
        <Button
          tooltipSide="left"
          data-tooltip="Zoom avant"
          aria-label="Zoom avant"
          onClick={controller.zoomIn}
        >
          <Plus size={20} />
        </Button>
        <Button
          tooltipSide="left"
          data-tooltip="Zoom arrière"
          aria-label="Zoom arrière"
          onClick={controller.zoomOut}
        >
          <Minus size={20} />
        </Button>
        <Button
          className="orientation-button"
          tooltipSide="left"
          aria-label={
            readingBearing === 0
              ? "Orientation : nord"
              : `Orientation : ${bearing === 0 ? "nord" : `${bearing}°`}. Tourner vers ${nextBearing(bearing, orientationEpoch) === 0 ? "le nord" : `${nextBearing(bearing, orientationEpoch)}°`}`
          }
          data-tooltip={
            readingBearing === 0
              ? "Ce plan est orienté au nord"
              : `Orientation : ${bearing === 0 ? "nord" : `${bearing}°`} · Cliquer pour tourner`
          }
          data-bearing={bearing}
          disabled={readingBearing === 0}
          onClick={() => {
            dispatch({ type: "toggleAlignment" });
          }}
        >
          <Compass size={18} style={{ transform: `rotate(${-bearing}deg)` }} />
          <span>{bearing === 0 ? "N" : `${bearing}°`}</span>
        </Button>
        <div />
        <Button
          aria-label="Vue d’ensemble de Toulouse"
          tooltipSide="left"
          data-tooltip="Vue d’ensemble de Toulouse"
          onClick={() => controller.overview(bearing)}
        >
          <RotateCcw size={18} />
        </Button>
      </div>
      <div className="control-dock">
        <section className="control-panel" aria-label="Comparaison des cartes">
          <span className="sr-only">
            {status.phase === "ready"
              ? "Cartes chargées"
              : status.phase === "error"
                ? "Chargement incomplet des cartes"
                : "Chargement des cartes…"}
          </span>
          {status.phase === "loading" && (
            <Tooltip text="Chargement des cartes…">
              <span className="loading-dot" />
            </Tooltip>
          )}
          <div className="timeline-tools">
            <Popover
              open={epochsOpen}
              onOpenChange={(open) => {
                setEpochsOpen(open);
                if (open) setPlacesOpen(false);
              }}
              label="Époques visibles"
              closeLabel="Fermer le choix des époques"
              className="epochs-popover"
              side="top"
              trigger={
                <Button className="epochs-button" data-tooltip="Choisir les époques visibles">
                  <Layers size={17} />
                  <span>Époques</span>
                </Button>
              }
            >
              <div role="group" aria-label="Époques visibles">
                {YEARS.map((value) => (
                  <label key={value}>
                    <Checkbox
                      checked={enabled.includes(value)}
                      onCheckedChange={() => toggleEpoch(value)}
                    />
                    <span>{epochLabel(value)}</span>
                    <small>{getEpoch(value).optionLabel}</small>
                  </label>
                ))}
              </div>
            </Popover>
            <ToggleGroup
              className="comparison-switch"
              aria-label="Forme de comparaison"
              value={mode}
              onValueChange={(value) => dispatch({ type: "mode", value: value as Mode })}
            >
              {(["overlay", "split", "loupe"] as const).map((shape) => (
                <ToggleItem key={shape} value={shape} asChild disabled={!enabled.length}>
                  <Button
                    aria-label={
                      shape === "split" ? "Rideau" : shape === "loupe" ? "Loupe" : "Superposition"
                    }
                    data-tooltip={
                      shape === "split" ? "Rideau" : shape === "loupe" ? "Loupe" : "Superposition"
                    }
                    disabled={!enabled.length}
                  >
                    {shape === "split" ? (
                      <ArrowLeftRight size={16} />
                    ) : shape === "loupe" ? (
                      <Search size={16} />
                    ) : (
                      <Blend size={16} />
                    )}
                    <span>
                      {shape === "split" ? "Rideau" : shape === "loupe" ? "Loupe" : "Superposition"}
                    </span>
                  </Button>
                </ToggleItem>
              ))}
            </ToggleGroup>
          </div>
          {mode === "loupe" && (
            <p className="sr-only" id="loupe-help">
              Déplacez la loupe pour explorer le passé
              <span className="sr-only">. Utilisez les flèches du clavier pour la déplacer.</span>
            </p>
          )}
          <div className="timeline">
            <div className="timeline-value sr-only" aria-live="polite">
              {timeLabel}
            </div>
            <div className="timeline-range">
              <div
                className="timeline-track"
                style={{
                  background: `linear-gradient(to right, var(--slider) ${timePosition * 100}%, var(--track) ${timePosition * 100}%)`,
                }}
              />
              <div
                className="timeline-thumb"
                style={{ left: `calc(${timePosition * 100}% + ${8 - 16 * timePosition}px)` }}
              />
              <Tooltip
                text="Voyage dans le temps · Utilisez les flèches pour ajuster l’année"
                sideOffset={56}
              >
                <input
                  key={dates.join(",")}
                  aria-label="Voyage dans le temps"
                  aria-valuetext={timeLabel}
                  type="range"
                  min={dates[0]}
                  max={TODAY}
                  disabled={!enabled.length}
                  step="1"
                  value={time}
                  onPointerDown={(e) => {
                    if (e.button !== 0 || !e.isPrimary || !enabled.length) return;
                    e.preventDefault();
                    e.currentTarget.focus();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    timelinePointer.current = true;
                    moveTimeline(e.currentTarget, e.clientX);
                  }}
                  onPointerMove={(e) => {
                    if (e.currentTarget.hasPointerCapture(e.pointerId))
                      moveTimeline(e.currentTarget, e.clientX);
                  }}
                  onPointerUp={() => {
                    timelinePointer.current = false;
                  }}
                  onPointerCancel={() => {
                    timelinePointer.current = false;
                  }}
                  onBlur={() => {
                    timelinePointer.current = false;
                  }}
                  onKeyDown={() => {
                    timelinePointer.current = false;
                  }}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    // Keyboard input retains one-year steps.
                    setTime(timelinePointer.current ? snapTimelineYear(value, dates) : value);
                  }}
                />
              </Tooltip>
            </div>
            <div className="timeline-ticks">
              {dates.map((date, index) => (
                <Button
                  key={date}
                  data-period={date}
                  aria-pressed={time === date}
                  style={{
                    // Match the native range's 16px thumb travel, including both end insets.
                    left: `calc(${timelinePosition(date, dates) * 100}% + ${8 - 16 * timelinePosition(date, dates)}px)`,
                    transform: index === 0 ? "none" : "translateX(-50%)",
                  }}
                  onClick={() => setTime(date)}
                >
                  {dateLabel(date)}
                </Button>
              ))}
            </div>
          </div>
        </section>
      </div>
      {(geo.message || geo.status === "locating") && (
        <div className="location-notice" role="status">
          <span>{geo.message || "Localisation en cours…"}</span>
          <Button aria-label="Masquer le message de localisation" onClick={geo.dismiss}>
            <X size={14} />
          </Button>
        </div>
      )}
      {errors.length > 0 && (
        <div className="error-toast" role="alert">
          {errors.map((e) => (
            <p key={e}>{e}</p>
          ))}
          <Button onClick={controller.retry}>Réessayer</Button>
          <Button aria-label="Fermer le message" onClick={controller.loading.dismiss}>
            <X size={16} />
          </Button>
        </div>
      )}
      <footer>
        <Coordinates controller={controller} />
        <span className="map-credits">
          {creditedPeriods.map((period) => (
            <React.Fragment key={period}>
              <a href={sourceUrl(period)} target="_blank" rel="noreferrer">
                {mapCredit(period)}
              </a>
              {" · "}
            </React.Fragment>
          ))}
          ©{" "}
          <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">
            OpenMapTiles
          </a>
          {" · "}©{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            OpenStreetMap
          </a>
        </span>
      </footer>
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
      <Dialog
        open={sources}
        onOpenChange={setSources}
        label="Cartes et précision"
        closeLabel="Fermer les sources"
      >
        <div className="eyebrow">SOURCES ET PRÉCISION</div>
        <h2>Cartes de Toulouse</h2>
        <h3>{getEpoch(year).details.title}</h3>
        {getEpoch(year).details.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {getEpoch(year).details.links?.map((link) => (
          <React.Fragment key={link.label}>
            <a href={link.path ? assetUrl(link.path) : link.url} target="_blank" rel="noreferrer">
              {link.label} <ExternalLink size={14} />
            </a>{" "}
          </React.Fragment>
        ))}
        <a href={sourceUrl(year)} target="_blank" rel="noreferrer">
          Ouvrir la carte source <ExternalLink size={14} />
        </a>
        <h3>Population de Toulouse</h3>
        <p>
          Ordres de grandeur de la ville historique, puis de la commune, pas de la métropole. Entre
          les repères documentés, le compteur interpole les valeurs et les arrondit au millier. Les
          estimations anciennes sont incertaines et les périmètres varient. Pour l’Antiquité, le
          repère est d’environ 20 000 habitants ; les variations du haut Moyen Âge ne sont pas
          reconstituées. Après 2023, le dernier recensement est conservé.
        </p>
        <p>
          Sources :{" "}
          <a
            href="https://archives.toulouse.fr/place-saint-etienne/"
            target="_blank"
            rel="noreferrer"
          >
            Archives de Toulouse
          </a>
          ,{" "}
          <a
            href="https://www.persee.fr/doc/hes_0752-5702_1998_num_17_3_1997"
            target="_blank"
            rel="noreferrer"
          >
            Laffont · Ancien Régime
          </a>
          ,{" "}
          <a
            href="https://fr.wikipedia.org/wiki/Toulouse#Démographie"
            target="_blank"
            rel="noreferrer"
          >
            Recensements historiques
          </a>
          ,{" "}
          <a
            href="https://www.insee.fr/fr/statistiques/2011101?geo=COM-31555"
            target="_blank"
            rel="noreferrer"
          >
            INSEE · 1968–2023
          </a>
          .
        </p>
        <h3>Utilisation</h3>
        <p>
          Le bouton boussole alterne entre le nord et l’orientation du plan visible : 53° pour 1777
          ou 84° pour 1631. Sur la frise, le plan qui apparaît devient la référence à mi-transition.
          Les autres plans restent orientés au nord. Ces angles approchés facilitent la lecture des
          légendes ; les déformations des anciens plans peuvent subsister.
        </p>
        <p>
          Sur ordinateur, maintenez la barre d’espace pour afficher la carte actuelle. Maintenez le
          bouton avec l’icône œil pour lire les rues actuelles avec une légère superposition
          historique. Relâchez pour revenir à la vue précédente. « Lieux » permet de rejoindre un
          quartier. « Partager » crée un lien vers la vue actuelle, avec les époques et les réglages
          choisis.
        </p>
        <h3>Frise et comparaison</h3>
        <p>
          La frise mélange les cartes sélectionnées dans « Époques » et la carte actuelle. Les
          outils au-dessus permettent de choisir la superposition, le rideau ou la loupe sans
          changer la date. Les sources disponibles sont les reconstructions de la fin de l’Antiquité
          et du XIIIe siècle, les héritages du parcellaire de 1550, les plans de 1631 et 1777, les
          cadastres de 1680 et 1830, l’état-major de 1848, les plans de 1860 et 1904, le plan
          d’inondation de 1875 et la vue aérienne de 1954. Les positions intermédiaires sont des
          transitions visuelles, pas des reconstitutions de ces années.
        </p>
        <h3>Crédits de toutes les cartes</h3>
        <ul className="source-credits">
          {YEARS.map((period) => (
            <li key={period}>
              <a href={sourceUrl(period)} target="_blank" rel="noreferrer">
                {epochLabel(period)} · {mapCredit(period)}
                {getEpoch(period).archiveCredit && ` / ${getEpoch(period).archiveCredit}`}
              </a>
            </li>
          ))}
        </ul>
        <h3>La ville actuelle</h3>
        <p>
          Carte vectorielle OpenFreeMap issue d’OpenStreetMap. La date de mise à jour varie selon
          les objets ; ce n’est pas une photographie de la ville à une date précise.
        </p>
        <p>
          <a href="https://openfreemap.org/" target="_blank" rel="noreferrer">
            OpenFreeMap
          </a>{" "}
          · ©{" "}
          <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">
            OpenMapTiles
          </a>{" "}
          · ©{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            OpenStreetMap
          </a>
        </p>
        <h3>Comprendre les écarts</h3>
        <p>
          Les écarts peuvent refléter les transformations de la ville ou les imprécisions des
          documents historiques. Pour les cadastres de 1680 et 1830, la précision et les points de
          calage ne sont pas publiés avec les tuiles. La concordance de chaque bâtiment n’est pas
          garantie. Les données anciennes sont absentes hors de leur couverture.
        </p>
        <h3>Réutilisation des données</h3>
        <p>
          Le catalogue officiel indique la Licence Ouverte v2.0 pour les données cadastrales. Les
          conditions propres au rendu et à l’hébergement des tuiles Makina Corpus restent à
          confirmer. Cette version sert à une exploration personnelle du concept ; une diffusion
          publique nécessiterait de clarifier ces conditions ou de produire une couche à partir des
          données ouvertes.
        </p>
        <a
          href={`https://data.toulouse-metropole.fr/explore/dataset/parcellaire-de-${year === "1680" ? "1680" : "1830"}/information/`}
          target="_blank"
          rel="noreferrer"
        >
          Catalogue officiel <ExternalLink size={14} />
        </a>
      </Dialog>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TooltipProvider delayDuration={320} skipDelayDuration={120}>
      <App />
    </TooltipProvider>
  </React.StrictMode>,
);
