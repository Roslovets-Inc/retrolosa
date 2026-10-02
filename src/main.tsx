import { X } from "lucide-react";
import React, { useEffect, useReducer, useState } from "react";
import { createRoot } from "react-dom/client";
import { useTranslation } from "react-i18next";

import { CityWidget } from "./CityWidget";
import { ComparisonPanel } from "./components/ComparisonPanel";
import { Header } from "./components/Header";
import { MapTools } from "./components/MapTools";
import { MapViewport } from "./components/MapViewport";
import { SourcesPanel } from "./components/SourcesPanel";
import { getEpoch } from "./epochs/catalog";
import type { EpochId as Year } from "./epochs/catalog";
import { translateLabel } from "./i18n-labels";
import { Coordinates } from "./map/Coordinates";
import { useMaps } from "./map/useMaps";
import { registerAppWorker, useOnline } from "./pwa";
import { useTheme } from "./theme";
import { Button, TooltipProvider } from "./ui";
import { useLocation } from "./useLocation";
import { derivePresentation } from "./view/presentation";
import {
  parseViewState,
  reduceViewState,
  serializeViewState,
  dateLabel as labelDate,
} from "./view/state";
import type { ViewState, ViewAction } from "./view/state";

import "maplibre-gl/dist/maplibre-gl.css";
import "./i18n";

import "./style.css";

const TODAY = new Date().getFullYear();
const viewReducer = (state: ViewState, action: ViewAction) => reduceViewState(state, action, TODAY);
const sourceUrl = (value: Year) => getEpoch(value).sourceUrl;
const mapCredit = (value: Year) => getEpoch(value).credit;

function App() {
  const { t } = useTranslation();
  const dateLabel = (value: number) => translateLabel(t, labelDate(value, TODAY));
  const online = useOnline();
  const { selection: themePreference, theme } = useTheme();
  const [initial] = useState(() => parseViewState(location.hash, TODAY));
  const [view, dispatch] = useReducer(viewReducer, initial.state);
  const { enabled, time, opacity, split } = view;
  const [openPanel, setOpenPanel] = useState<"places" | "epochs" | null>(null);
  const [compareHeld, setCompareHeld] = useState(false);
  const [peek, setPeek] = useState(false),
    [sources, setSources] = useState(false);
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
  const errors = [
    ...new Set(
      status.failures.map((failure) =>
        failure.kind === "renderer"
          ? t("failure.renderer")
          : t("failure.message", {
              map: t(`failure.${failure.resource.map}`),
              label: translateLabel(t, failure.resource.label),
              reason: t(`failure.${failure.kind}`),
            }),
      ),
    ),
  ];
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
  return (
    <main tabIndex={-1}>
      <MapViewport
        modernEl={modernEl}
        oldEl={oldEl}
        visibleMode={visibleMode}
        opacity={opacity}
        historicOpacity={historicOpacity}
        split={split}
        year={year}
        dispatch={dispatch}
      />
      <Header
        theme={theme}
        themePreference={themePreference}
        placesOpen={openPanel === "places"}
        onPlacesOpenChange={(open) => setOpenPanel(open ? "places" : null)}
        onSources={() => setSources(true)}
        onPlace={(place) => controller.flyTo({ ...place, duration: 1000, essential: true })}
        createShareUrl={() => {
          const url = new URL(location.href);
          url.hash = serializeViewState(view, { ...controller.getCamera(), bearing }, year);
          return url;
        }}
      />
      <CityWidget
        year={populationYear}
        label={dateLabel(populationYear)}
        onSources={() => setSources(true)}
      />
      {!online && (
        <div className="offline-notice" role="status">
          {t("main.youAreOfflineReconnectToLoadTheMaps")}{" "}
        </div>
      )}
      <MapTools
        opacity={opacity}
        hasEpochs={enabled.length > 0}
        compareHeld={compareHeld}
        setCompareHeld={setCompareHeld}
        locationStatus={geo.status}
        onLocation={geo.toggle}
        onZoomIn={controller.zoomIn}
        onZoomOut={controller.zoomOut}
        onOverview={() => controller.overview(bearing)}
        onOpacityChange={(value) => dispatch({ type: "opacity", value })}
        onToggleAlignment={() => dispatch({ type: "toggleAlignment", epoch: orientationEpoch })}
        bearing={bearing}
        readingBearing={readingBearing}
        orientationEpoch={orientationEpoch}
      />
      <ComparisonPanel
        view={view}
        dispatch={dispatch}
        dates={dates}
        timeLabel={timeLabel}
        today={TODAY}
        phase={status.phase}
        canRetry={
          errors.length === 0 &&
          status.resources.some(
            (resource) =>
              resource.state === "error" && !status.unavailableMaps.includes(resource.map),
          )
        }
        onRetry={controller.retry}
        epochsOpen={openPanel === "epochs"}
        onEpochsOpenChange={(open) => setOpenPanel(open ? "epochs" : null)}
      />
      {(geo.message || geo.status === "locating") && (
        <div className="location-notice" role="status">
          <span>{geo.message || t("main.locating")}</span>
          <Button aria-label={t("main.dismissLocationMessage")} onClick={geo.dismiss}>
            <X size={14} />
          </Button>
        </div>
      )}
      {errors.length > 0 && (
        <div className="error-toast" role="alert">
          {errors.map((e) => (
            <p key={e}>{e}</p>
          ))}
          <Button onClick={controller.retry}>{t("main.retry")}</Button>
          <Button aria-label={t("main.closeMessage")} onClick={controller.loading.dismiss}>
            <X size={16} />
          </Button>
        </div>
      )}
      <footer>
        <Coordinates
          subscribe={controller.subscribeCoordinates}
          getSnapshot={controller.getCoordinates}
        />
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
      {sources && (
        <SourcesPanel
          year={year}
          onOpenChange={setSources}
          onReload={() => {
            const url = new URL(location.href);
            url.hash = serializeViewState(view, { ...controller.getCamera(), bearing }, year);
            history.replaceState(null, "", url);
            location.reload();
          }}
        />
      )}
    </main>
  );
}
registerAppWorker();
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TooltipProvider delayDuration={320} skipDelayDuration={120}>
      <App />
    </TooltipProvider>
  </React.StrictMode>,
);
