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
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState<number | null>(null);
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
    <section className="population-counter" aria-label={t("cityWidget.toulouseAtThisTime")}>
      <span>
        {t("cityWidget.toulouse")} {label}
      </span>
      <Button
        className="population-value"
        onClick={onSources}
        aria-label={t("cityWidget.estimatedPopulationOfToulouseAboutInhabitantsViewSources", {
          v0: populationAt(year),
        })}
        data-tooltip={t("cityWidget.estimatedPopulationOfToulouseViewSources")}
      >
        <strong>
          ≈ {populationAt(year).toLocaleString(i18n.resolvedLanguage)}{" "}
          <small>{t("cityWidget.inhabitants")}</small>
        </strong>
      </Button>
      <div
        id="city-events"
        className="city-events"
        role="group"
        aria-label={t("cityWidget.historicalMilestones")}
      >
        {events.map((event) => {
          const Icon = icons[event.icon];
          return (
            <Button
              key={event.year}
              data-tooltip={`${event.year} · ${t(`events.${event.year}.title`)}`}
              aria-label={`${event.year} · ${t(`events.${event.year}.title`)}`}
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
            aria-label={t("cityWidget.closeHistoricalMilestone")}
            onClick={() => setSelected(null)}
          >
            <X size={15} />
          </Button>
          <h3>
            {active.year} · {t(`events.${active.year}.title`)}
          </h3>
          <p>{t(`events.${active.year}.text`)}</p>
          <a href={active.source} target="_blank" rel="noreferrer">
            {t("cityWidget.source")} <ExternalLink size={12} />
          </a>
        </div>
      )}
    </section>
  );
}
