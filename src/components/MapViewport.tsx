import { ArrowLeftRight } from "lucide-react";
import React, { useRef, useState } from "react";

import { getEpoch } from "../epochs/catalog";
import type { EpochId as Year } from "../epochs/catalog";
import { Button } from "../ui";
import type { Mode, ViewAction } from "../view/state";
export function MapViewport({
  modernEl,
  oldEl,
  visibleMode,
  opacity,
  historicOpacity,
  split,
  year,
  dispatch,
}: {
  modernEl: React.Ref<HTMLDivElement>;
  oldEl: React.Ref<HTMLDivElement>;
  visibleMode: Mode | "modern";
  opacity: number;
  historicOpacity: number;
  split: number;
  year: Year;
  dispatch: React.Dispatch<ViewAction>;
}) {
  const [loupe, setLoupe] = useState({ x: 50, y: 42 });
  const loupeDrag = useRef<{ id: number; x: number; y: number } | null>(null);
  const loupeLeft = `clamp(var(--loupe-radius), ${loupe.x}%, calc(100% - var(--loupe-radius)))`;
  const loupeTop = `clamp(var(--loupe-radius), ${loupe.y}%, calc(100% - var(--loupe-radius)))`;
  const epochLabel = (value: Year) => getEpoch(value).label;
  const setSplit = (value: number) => dispatch({ type: "split", value });
  return (
    <>
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
    </>
  );
}
