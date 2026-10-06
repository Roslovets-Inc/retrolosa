import { Route } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Slider } from "../ui";

export function StreetControls({
  opacity,
  onOpacityChange,
}: {
  opacity: number;
  onOpacityChange: (value: number) => void;
}) {
  const { t } = useTranslation();
  const [lastOpacity, setLastOpacity] = useState(() => opacity || 80);
  const rememberOpacity = (value: number) => {
    if (value > 0) setLastOpacity(value);
  };
  const buttonLabel = t(opacity === 0 ? "streets.show" : "streets.hide");
  return (
    <section className="street-controls" aria-label={t("streets.title")}>
      <Slider
        value={opacity}
        label={t("streets.opacity")}
        valueText={opacity === 0 ? t("streets.hidden") : `${opacity} %`}
        onValueChange={onOpacityChange}
        onValueCommit={rememberOpacity}
        offThreshold={25}
      />
      <Button
        className="street-toggle"
        aria-label={buttonLabel}
        data-tooltip={buttonLabel}
        tooltipSide="left"
        aria-pressed={opacity > 0}
        onClick={() => {
          rememberOpacity(opacity);
          onOpacityChange(opacity === 0 ? lastOpacity : 0);
        }}
      >
        <Route size={17} aria-hidden="true" />
      </Button>
    </section>
  );
}
