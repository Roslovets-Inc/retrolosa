import { EPOCH_IDS, epochAtDate } from "../epochs/catalog";
import type { EpochId } from "../epochs/catalog";
import { visibleEpoch } from "../orientation";
import { dateLabel, normalizeTimeSelection } from "./state";
import type { ViewState } from "./state";

/** Resolve painter opacities independently of global comparison opacity. */
export function resolveTimeline(state: Pick<ViewState, "enabled" | "time">, today: number) {
  const { time, enabled } = normalizeTimeSelection(state, today);
  const dates = [...enabled.map(Number), today];
  const lower = dates.filter((date) => date <= time).at(-1)!;
  const upper = dates.find((date) => date > time) ?? today;
  const fraction = lower === upper ? 0 : (time - lower) / (upper - lower);
  const opacities = Object.fromEntries(
    EPOCH_IDS.map((id) => [
      id,
      !enabled.includes(id)
        ? 0
        : Number(id) === lower
          ? upper === today
            ? 1 - fraction
            : 1
          : Number(id) === upper
            ? fraction
            : 0,
    ]),
  ) as Record<EpochId, number>;
  const active = enabled.filter((id) => opacities[id] > 0);
  const epoch = visibleEpoch(time, dates);
  // Keep a historical sheet for source details and the legacy year field at modernity.
  const year = (epoch === today ? enabled.at(-1) : String(epoch)) as EpochId | undefined;
  const timeLabel = dates.includes(time)
    ? (epochAtDate(time)?.timelineLabel ?? dateLabel(time, today))
    : `${dateLabel(lower, today)} → ${dateLabel(upper, today)}`;
  return {
    dates,
    time,
    lower,
    upper,
    fraction,
    opacities,
    active,
    epoch,
    year: year ?? EPOCH_IDS[0],
    timeLabel,
  };
}

export interface TransientComparison {
  compareHeld: boolean;
  peek: boolean;
}
export function derivePresentation(
  state: ViewState,
  temporary: TransientComparison,
  today: number,
) {
  const timeline = resolveTimeline(state, today);
  const visibleMode: ViewState["mode"] | "modern" =
    state.enabled.length === 0
      ? "modern"
      : temporary.compareHeld
        ? "overlay"
        : temporary.peek
          ? "modern"
          : state.mode;
  const historicOpacity =
    !state.enabled.length || visibleMode === "modern"
      ? 0
      : temporary.compareHeld
        ? 0.2
        : state.opacity / 100;
  const creditedPeriods = historicOpacity > 0 ? timeline.active : [];
  // Temporary comparison does not rotate the camera; restore its view on release.
  const orientationEpoch = !state.enabled.length || state.opacity === 0 ? today : timeline.epoch;
  const readingBearing = epochAtDate(orientationEpoch)?.bearing ?? 0;
  return {
    ...timeline,
    visibleMode,
    historicOpacity,
    creditedPeriods,
    orientationEpoch,
    readingBearing,
    bearing: state.alignedToMap ? readingBearing : 0,
    populationYear: visibleMode === "modern" ? today : timeline.time,
  };
}
