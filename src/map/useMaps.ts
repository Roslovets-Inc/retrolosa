import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { Theme } from "../theme";
import { resolveTimeline } from "../view/presentation";
import type { InitialView, ViewState } from "../view/state";
import { MapController } from "./controller";
import { initializeMapRuntime } from "./runtime";

export function useMaps(
  initial: InitialView,
  theme: Theme,
  selection: Pick<ViewState, "time" | "enabled">,
  today: number,
  historicVisible: boolean,
  bearing: number,
) {
  const modernEl = useRef<HTMLDivElement>(null);
  const oldEl = useRef<HTMLDivElement>(null);
  const [controller] = useState(
    () =>
      new MapController({
        initial,
        theme,
        opacities: resolveTimeline(initial.state, today).opacities,
        assets: { baseUrl: import.meta.env.BASE_URL, origin: location.origin },
      }),
  );
  const status = useSyncExternalStore(controller.loading.subscribe, controller.loading.getSnapshot);
  const { enabled, time } = selection;
  useEffect(() => {
    if (!modernEl.current || !oldEl.current) return;
    initializeMapRuntime();
    controller.mount(modernEl.current, oldEl.current);
    return controller.unmount;
  }, [controller]);
  useEffect(() => {
    controller.setTheme(theme);
  }, [controller, theme]);
  useEffect(() => {
    controller.setHistorical(resolveTimeline({ enabled, time }, today).opacities, historicVisible);
  }, [controller, enabled, time, today, historicVisible]);
  useEffect(() => {
    controller.setBearing(bearing);
  }, [controller, bearing]);
  return { controller, modernEl, oldEl, status };
}
