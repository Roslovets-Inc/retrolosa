import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { Theme } from "../theme";
import { resolveTimeline } from "../view/presentation";
import type { InitialView, ViewState } from "../view/state";
import { MapController } from "./controller";
import { initializeMapRuntime, disposeMapRuntime } from "./runtime";

export function useMaps(
  initial: InitialView,
  theme: Theme,
  selection: Pick<ViewState, "time" | "enabled">,
  today: number,
  historicVisible: boolean,
  bearing: number,
  streetsEnabled: boolean,
) {
  const modernEl = useRef<HTMLDivElement>(null);
  const oldEl = useRef<HTMLDivElement>(null);
  const streetsEl = useRef<HTMLDivElement>(null);
  const [controller] = useState(
    () =>
      new MapController({
        initial,
        theme,
        opacities: resolveTimeline(initial.state, today).opacities,
        prepared: resolveTimeline(initial.state, today).prepared,
        assets: { baseUrl: import.meta.env.BASE_URL, origin: location.origin },
      }),
  );
  const status = useSyncExternalStore(controller.loading.subscribe, controller.loading.getSnapshot);
  const { enabled, time } = selection;
  useEffect(() => {
    if (!modernEl.current || !oldEl.current || !streetsEl.current) return;
    initializeMapRuntime();
    controller.mount(modernEl.current, oldEl.current, streetsEl.current);
    return () => {
      controller.unmount();
      disposeMapRuntime();
    };
  }, [controller]);
  useEffect(() => {
    const colors = getComputedStyle(document.documentElement);
    controller.setStreetColors({
      line: colors.getPropertyValue("--street-line").trim(),
      text: colors.getPropertyValue("--street-text").trim(),
      halo: colors.getPropertyValue("--street-halo").trim(),
    });
    controller.setTheme(theme);
  }, [controller, theme]);
  useEffect(() => {
    const timeline = resolveTimeline({ enabled, time }, today);
    controller.setHistorical(timeline.opacities, historicVisible, timeline.prepared);
  }, [controller, enabled, time, today, historicVisible]);
  useEffect(() => {
    controller.setBearing(bearing);
  }, [controller, bearing]);
  useEffect(() => {
    controller.setStreets(streetsEnabled);
  }, [controller, streetsEnabled]);
  return { controller, modernEl, oldEl, streetsEl, status };
}
