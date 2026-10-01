import {
  Crown,
  GraduationCap,
  Flame,
  Waves,
  TrainFront,
  House,
  Plane,
  TramFront,
  Skull,
  Swords,
  ExternalLink,
  X,
  ChevronDown,
} from "lucide-react";
import React, { useEffect, useState } from "react";

import { eventsAt } from "./city-events";
import { populationAt } from "./population";
import { Button } from "./ui";

const icons = {
  crown: Crown,
  school: GraduationCap,
  flame: Flame,
  waves: Waves,
  train: TrainFront,
  flood: House,
  plane: Plane,
  metro: TramFront,
  plague: Skull,
  swords: Swords,
};

export function CityWidget({
  year,
  label,
  onSources,
}: {
  year: number;
  label: string;
  onSources: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  const events = eventsAt(year);
  const active = events.find((event) => event.year === selected);
  return (
    <section
      className="population-counter"
      aria-label="Toulouse à cette époque"
      data-expanded={expanded}
    >
      <span>Toulouse · {label}</span>
      <Button
        className="population-value"
        onClick={onSources}
        aria-label={`Population estimée de Toulouse : environ ${populationAt(year)} habitants. Voir les sources`}
        data-tooltip="Population estimée de Toulouse · Voir les sources"
      >
        <strong>
          ≈ {populationAt(year).toLocaleString("fr-FR")} <small>habitants</small>
        </strong>
      </Button>
      <Button
        className="city-events-toggle"
        aria-expanded={expanded}
        aria-controls="city-events"
        onClick={() => {
          setExpanded(!expanded);
          setSelected(null);
        }}
      >
        Repères historiques <ChevronDown size={14} />
      </Button>
      <div id="city-events" className="city-events" role="group" aria-label="Repères historiques">
        {events.map((event) => {
          const Icon = icons[event.icon];
          return (
            <Button
              key={event.year}
              data-tooltip={`${event.year} · ${event.title}`}
              aria-label={`${event.year} · ${event.title}`}
              aria-expanded={selected === event.year}
              aria-controls="city-event-detail"
              onClick={() => setSelected(selected === event.year ? null : event.year)}
            >
              <Icon size={17} aria-hidden="true" />
              <span>{event.year}</span>
            </Button>
          );
        })}
      </div>
      {active && (
        <div className="city-event-detail" id="city-event-detail">
          <Button
            className="event-close"
            aria-label="Fermer le repère historique"
            onClick={() => setSelected(null)}
          >
            <X size={15} />
          </Button>
          <h3>
            {active.year} · {active.title}
          </h3>
          <p>{active.text}</p>
          <a href={active.source} target="_blank" rel="noreferrer">
            Source <ExternalLink size={12} />
          </a>
        </div>
      )}
    </section>
  );
}
