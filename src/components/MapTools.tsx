import { Eye, Navigation, Plus, Minus, Compass, RotateCcw } from "lucide-react";
import React from "react";

import { nextBearing } from "../orientation";
import { Button, Slider } from "../ui";
export function MapTools({
  opacity,
  hasEpochs,
  compareHeld,
  setCompareHeld,
  locationStatus,
  onLocation,
  onZoomIn,
  onZoomOut,
  onOverview,
  onOpacityChange,
  onToggleAlignment,
  bearing,
  readingBearing,
  orientationEpoch,
}: {
  opacity: number;
  hasEpochs: boolean;
  compareHeld: boolean;
  setCompareHeld: (held: boolean) => void;
  locationStatus: "off" | "locating" | "following";
  onLocation: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onOverview: () => void;
  onOpacityChange: (value: number) => void;
  onToggleAlignment: () => void;
  bearing: number;
  readingBearing: number;
  orientationEpoch: number;
}) {
  return (
    <>
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
            onValueChange={onOpacityChange}
            label="Opacité de la carte historique"
            valueText={opacity === 0 ? "Carte actuelle" : `${opacity} %`}
            disabled={!hasEpochs}
          />
          <output>{opacity}%</output>
        </section>
      </div>
      <div className="zoom-controls">
        <Button
          className={locationStatus !== "off" ? "location-active" : ""}
          aria-label={locationStatus === "off" ? "Me localiser" : "Désactiver la localisation"}
          tooltipSide="left"
          data-tooltip={locationStatus === "off" ? "Me localiser" : "Désactiver la localisation"}
          aria-pressed={locationStatus !== "off"}
          onClick={onLocation}
        >
          <Navigation size={19} fill={locationStatus === "following" ? "currentColor" : "none"} />
        </Button>
        <div />
        <Button
          tooltipSide="left"
          data-tooltip="Zoom avant"
          aria-label="Zoom avant"
          onClick={onZoomIn}
        >
          <Plus size={20} />
        </Button>
        <Button
          tooltipSide="left"
          data-tooltip="Zoom arrière"
          aria-label="Zoom arrière"
          onClick={onZoomOut}
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
          onClick={onToggleAlignment}
        >
          <Compass size={18} style={{ transform: `rotate(${-bearing}deg)` }} />
          <span>{bearing === 0 ? "N" : `${bearing}°`}</span>
        </Button>
        <div />
        <Button
          aria-label="Vue d’ensemble de Toulouse"
          tooltipSide="left"
          data-tooltip="Vue d’ensemble de Toulouse"
          onClick={onOverview}
        >
          <RotateCcw size={18} />
        </Button>
      </div>
    </>
  );
}
