import { Layers, ArrowLeftRight, Search, Blend } from "lucide-react";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";

import { EPOCH_IDS as YEARS, getEpoch } from "../epochs/catalog";
import type { EpochId as Year } from "../epochs/catalog";
import { translateLabel } from "../i18n-labels";
import type { LoadState } from "../map/loading";
import { timelinePosition, timelineYear, snapTimelineYear } from "../timeline";
import { Button, Popover, Checkbox, ToggleGroup, ToggleItem, Tooltip } from "../ui";
import { dateLabel as labelDate } from "../view/state";
import type { ViewState, ViewAction, Mode } from "../view/state";
export function ComparisonPanel({
  view,
  dispatch,
  dates,
  timeLabel,
  today,
  phase,
  canRetry,
  onRetry,
  epochsOpen,
  onEpochsOpenChange,
}: {
  view: ViewState;
  dispatch: React.Dispatch<ViewAction>;
  dates: number[];
  timeLabel: string;
  today: number;
  phase: LoadState;
  canRetry: boolean;
  onRetry: () => void;
  epochsOpen: boolean;
  onEpochsOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { time, mode, enabled } = view;
  const TODAY = today;
  const timelinePointer = useRef(false);
  const dateLabel = (value: number) => translateLabel(t, labelDate(value, today));
  const isCentury = (value: number) => [450, 1195, 1250].includes(value);
  const epochLabel = (value: Year) => translateLabel(t, getEpoch(value).label);
  const setTime = (value: number) => dispatch({ type: "time", value });
  const timePosition = timelinePosition(time, dates);
  const moveTimeline = (element: HTMLInputElement, clientX: number) => {
    const box = element.getBoundingClientRect();
    const position = (clientX - box.left - 8) / Math.max(1, box.width - 16);
    setTime(snapTimelineYear(Math.round(timelineYear(position, dates)), dates));
  };
  const toggleEpoch = (id: Year) => dispatch({ type: "toggleEpoch", id });

  return (
    <>
      <div className="control-dock">
        <section className="control-panel" aria-label={t("comparisonPanel.mapComparison")}>
          <span className="sr-only" role="status">
            {phase === "ready"
              ? t("comparisonPanel.mapsLoaded")
              : phase === "error"
                ? t("comparisonPanel.mapsPartiallyLoaded")
                : phase === "unavailable"
                  ? t("comparisonPanel.mapDisplayInterrupted")
                  : t("comparisonPanel.loadingMaps")}
          </span>
          {(phase === "unavailable" || canRetry) && (
            <div className="map-status">
              {phase === "unavailable" && (
                <span>{t("comparisonPanel.displayInterruptedWaitingForGraphicsRecovery")}</span>
              )}
              {canRetry && <Button onClick={onRetry}>{t("comparisonPanel.retry")}</Button>}
            </div>
          )}
          {phase === "loading" && (
            <Tooltip text={t("comparisonPanel.loadingMaps")}>
              <span className="loading-dot" />
            </Tooltip>
          )}
          <div className="timeline-tools">
            <Popover
              open={epochsOpen}
              onOpenChange={onEpochsOpenChange}
              label={t("comparisonPanel.visibleEpochs")}
              closeLabel={t("comparisonPanel.closeEpochSelection")}
              className="epochs-popover"
              side="top"
              trigger={
                <Button
                  className="epochs-button"
                  data-tooltip={t("comparisonPanel.chooseVisibleEpochs")}
                >
                  <Layers size={17} />
                  <span>{t("comparisonPanel.epochs")}</span>
                </Button>
              }
            >
              <div role="group" aria-label={t("comparisonPanel.visibleEpochs")}>
                {YEARS.map((value) => (
                  <label key={value}>
                    <Checkbox
                      checked={enabled.includes(value)}
                      onCheckedChange={() => toggleEpoch(value)}
                    />
                    <span>{epochLabel(value)}</span>
                    <small>{translateLabel(t, getEpoch(value).optionLabel)}</small>
                  </label>
                ))}
              </div>
            </Popover>
            <ToggleGroup
              className="comparison-switch"
              aria-label={t("comparisonPanel.comparisonMode")}
              value={mode}
              onValueChange={(value) => dispatch({ type: "mode", value: value as Mode })}
            >
              {(["overlay", "split", "loupe"] as const).map((shape) => (
                <ToggleItem key={shape} value={shape} asChild disabled={!enabled.length}>
                  <Button
                    aria-label={
                      shape === "split"
                        ? translateLabel(t, "Rideau")
                        : shape === "loupe"
                          ? translateLabel(t, "Loupe")
                          : translateLabel(t, "Superposition")
                    }
                    data-tooltip={
                      shape === "split"
                        ? translateLabel(t, "Rideau")
                        : shape === "loupe"
                          ? translateLabel(t, "Loupe")
                          : translateLabel(t, "Superposition")
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
                      {shape === "split"
                        ? translateLabel(t, "Rideau")
                        : shape === "loupe"
                          ? translateLabel(t, "Loupe")
                          : translateLabel(t, "Superposition")}
                    </span>
                  </Button>
                </ToggleItem>
              ))}
            </ToggleGroup>
          </div>
          {mode === "loupe" && (
            <p className="sr-only" id="loupe-help">
              {t("comparisonPanel.moveTheMagnifierToExploreThePast")}{" "}
              <span className="sr-only">{t("comparisonPanel.useTheArrowKeysToMoveIt")}</span>
            </p>
          )}
          <div className="timeline">
            <div className="timeline-value timeline-current sr-only" aria-live="polite">
              {translateLabel(t, timeLabel)}
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
                text={t("comparisonPanel.timeTravelUseTheArrowsToAdjustTheYear")}
                sideOffset={56}
              >
                <input
                  key={dates.join(",")}
                  aria-label={t("comparisonPanel.timeTravel")}
                  aria-valuetext={translateLabel(t, timeLabel)}
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
                  aria-label={isCentury(date) ? t(`comparisonPanel.century${date}`) : undefined}
                  data-tooltip={isCentury(date) ? t(`comparisonPanel.century${date}`) : undefined}
                  style={{
                    // Match the native range's 16px thumb travel, including both end insets.
                    left:
                      index === 0
                        ? 0
                        : `calc(${timelinePosition(date, dates) * 100}% + ${8 - 16 * timelinePosition(date, dates)}px)`,
                    transform:
                      index === 0
                        ? "none"
                        : index === dates.length - 1
                          ? "translateX(-100%)"
                          : "translateX(-50%)",
                  }}
                  onClick={() => setTime(date)}
                >
                  {isCentury(date) ? t(`comparisonPanel.tick${date}`) : dateLabel(date)}
                </Button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
