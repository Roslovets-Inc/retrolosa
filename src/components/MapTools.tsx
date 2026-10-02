import { Eye, Navigation, Plus, Minus, Compass, RotateCcw } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

import { translateLabel } from "../i18n-labels";
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
  const { t } = useTranslation();
  return (
    <>
      <div
        className="opacity-controls"
        role="group"
        aria-label={t("mapTools.transparencyAndComparison")}
      >
        <Button
          className="compare-hold"
          tooltipSide="left"
          aria-label={t("mapTools.holdToCompareWithTheCurrentMap")}
          aria-pressed={compareHeld}
          data-tooltip={t("mapTools.holdToReadTodaySStreets")}
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
        <section className="opacity-panel" aria-label={t("mapTools.opacity")}>
          <Slider
            value={opacity}
            onValueChange={onOpacityChange}
            label={t("mapTools.historicalMapOpacity")}
            valueText={opacity === 0 ? t("mapTools.currentMap") : `${opacity} %`}
            disabled={!hasEpochs}
          />
          <output>{opacity}%</output>
        </section>
      </div>
      <div className="zoom-controls">
        <Button
          className={locationStatus !== "off" ? "location-active" : ""}
          aria-label={
            locationStatus === "off" ? t("mapTools.locateMe") : t("mapTools.stopLocationTracking")
          }
          tooltipSide="left"
          data-tooltip={
            locationStatus === "off" ? t("mapTools.locateMe") : t("mapTools.stopLocationTracking")
          }
          aria-pressed={locationStatus !== "off"}
          onClick={onLocation}
        >
          <Navigation size={19} fill={locationStatus === "following" ? "currentColor" : "none"} />
        </Button>
        <div />
        <Button
          tooltipSide="left"
          data-tooltip={t("mapTools.zoomIn")}
          aria-label={t("mapTools.zoomIn")}
          onClick={onZoomIn}
        >
          <Plus size={20} />
        </Button>
        <Button
          tooltipSide="left"
          data-tooltip={t("mapTools.zoomOut")}
          aria-label={t("mapTools.zoomOut")}
          onClick={onZoomOut}
        >
          <Minus size={20} />
        </Button>
        <Button
          className="orientation-button"
          tooltipSide="left"
          aria-label={
            readingBearing === 0 && bearing === 0
              ? t("mapTools.orientationNorth")
              : t("mapTools.orientationRotateTowards", {
                  v0: bearing === 0 ? translateLabel(t, "nord") : `${bearing}°`,
                  v1:
                    nextBearing(bearing, orientationEpoch) === 0
                      ? translateLabel(t, "le nord")
                      : `${nextBearing(bearing, orientationEpoch)}°`,
                })
          }
          data-tooltip={
            readingBearing === 0 && bearing === 0
              ? t("mapTools.thisMapFacesNorth")
              : t("mapTools.orientationClickToRotate", {
                  v0: bearing === 0 ? translateLabel(t, "nord") : `${bearing}°`,
                })
          }
          data-bearing={bearing}
          disabled={readingBearing === 0 && bearing === 0}
          onClick={onToggleAlignment}
        >
          <Compass size={18} style={{ transform: `rotate(${-bearing}deg)` }} />
          <span>{bearing === 0 ? "N" : `${bearing}°`}</span>
        </Button>
        <div />
        <Button
          aria-label={t("mapTools.overviewOfToulouse")}
          tooltipSide="left"
          data-tooltip={t("mapTools.overviewOfToulouse")}
          onClick={onOverview}
        >
          <RotateCcw size={18} />
        </Button>
      </div>
    </>
  );
}
