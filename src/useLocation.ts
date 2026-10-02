import { Marker, type Map } from "maplibre-gl";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

// Browser geolocation only; no separate location service or backend.
export function useLocation(maps: React.RefObject<Map[]>) {
  const { t } = useTranslation();
  const [accuracyMetres, setAccuracyMetres] = useState(0);
  const [status, setStatus] = useState<"off" | "locating" | "following">("off");
  const [message, setMessage] = useState("");
  const watch = useRef<number | null>(null);
  const generation = useRef(0);
  const markers = useRef<Marker[]>([]);
  const stop = useCallback(() => {
    generation.current++;
    if (watch.current !== null) navigator.geolocation?.clearWatch(watch.current);
    watch.current = null;
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];
    setStatus("off");
  }, []);
  useEffect(() => stop, [stop]);
  useEffect(() => {
    markers.current.forEach((marker) =>
      marker.getElement().setAttribute(
        "aria-label",
        t(status === "locating" ? "location.last" : "location.position", {
          accuracy: accuracyMetres,
        }),
      ),
    );
  }, [t, accuracyMetres, status]);
  const toggle = () => {
    if (watch.current !== null) {
      stop();
      setMessage("");
      return;
    }
    if (!navigator.geolocation) {
      setMessage("location.unsupported");
      return;
    }
    if (!maps.current.length) return;
    setMessage("");
    setStatus("locating");
    const request = ++generation.current;
    watch.current = navigator.geolocation.watchPosition(
      (position) => {
        if (request !== generation.current) return;
        const { longitude: lon, latitude: lat, accuracy } = position.coords;
        if (lon < 1.405 || lon > 1.48 || lat < 43.575 || lat > 43.635) {
          stop();
          setMessage("location.outside");
          return;
        }
        if (!markers.current.length) {
          markers.current = maps.current.map((map) => {
            const el = document.createElement("div");
            el.className = "location-dot";
            el.setAttribute("role", "img");
            el.setAttribute(
              "aria-label",
              t("location.position", { accuracy: Math.round(accuracy) }),
            );
            return new Marker({ element: el }).setLngLat([lon, lat]).addTo(map);
          });
        }
        markers.current.forEach((marker) => {
          marker.getElement().style.opacity = "1";
          marker.setLngLat([lon, lat]);
          marker
            .getElement()
            .setAttribute("aria-label", t("location.position", { accuracy: Math.round(accuracy) }));
        });
        setStatus("following");
        setAccuracyMetres(Math.round(accuracy));
        setMessage("location.active");
        maps.current[0]?.easeTo({ center: [lon, lat], duration: 600 });
      },
      (error) => {
        if (request !== generation.current) return;
        if (error.code === 1) {
          stop();
          setMessage("location.permission");
        } else {
          // A temporary GPS loss must not cancel the watch; it can recover on its own.
          setStatus("locating");
          markers.current.forEach((marker) => {
            marker.getElement().style.opacity = "0.4";
            marker.getElement().setAttribute("aria-label", t("location.last"));
          });
          setMessage("location.waiting");
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
  };
  return {
    status,
    message: message ? t(message, { accuracy: accuracyMetres }) : "",
    toggle,
    dismiss: () => setMessage(""),
  };
}
