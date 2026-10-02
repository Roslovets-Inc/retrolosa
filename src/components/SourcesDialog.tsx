import { ExternalLink } from "lucide-react";

import "../epochs/source-translations";
import React from "react";
import { useTranslation } from "react-i18next";

import { EPOCH_IDS as YEARS, getEpoch } from "../epochs/catalog";
import type { EpochId as Year } from "../epochs/catalog";
import { getEpochDetails } from "../epochs/details";
import { translateLabel } from "../i18n-labels";
export function SourcesContent({ year }: { year: Year }) {
  const { t } = useTranslation("sources");
  const details = getEpochDetails(year, (key, defaultValue, values) =>
    t(key, { defaultValue, ...values }),
  );
  const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;
  const sourceUrl = (value: Year) => getEpoch(value).sourceUrl;
  const epochLabel = (value: Year) => translateLabel(t, getEpoch(value).label);
  const mapCredit = (value: Year) => getEpoch(value).credit;
  return (
    <>
      <div className="eyebrow">{t("sourcesDialog.sourcesAndAccuracy")}</div>
      <h2>{t("sourcesDialog.mapsOfToulouse")}</h2>
      <h3>{details.title}</h3>
      {details.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {details.links?.map((link) => (
        <React.Fragment key={link.label}>
          <a href={link.path ? assetUrl(link.path) : link.url} target="_blank" rel="noreferrer">
            {link.label} <ExternalLink size={14} />
          </a>{" "}
        </React.Fragment>
      ))}
      <a href={sourceUrl(year)} target="_blank" rel="noreferrer">
        {t("sourcesDialog.openTheSourceMap")} <ExternalLink size={14} />
      </a>
      <h3>{t("sourcesDialog.populationOfToulouse")}</h3>
      <p>{t("sourcesDialog.ordersOfMagnitudeForTheHistoricalCityThenThe")}</p>
      <p>
        {t("sourcesDialog.sources")}{" "}
        <a
          href="https://archives.toulouse.fr/place-saint-etienne/"
          target="_blank"
          rel="noreferrer"
        >
          Archives de Toulouse
        </a>
        ,{" "}
        <a
          href="https://www.persee.fr/doc/hes_0752-5702_1998_num_17_3_1997"
          target="_blank"
          rel="noreferrer"
        >
          Laffont · Ancien Régime
        </a>
        ,{" "}
        <a
          href="https://fr.wikipedia.org/wiki/Toulouse#Démographie"
          target="_blank"
          rel="noreferrer"
        >
          {t("sourcesDialog.historicalCensuses")}{" "}
        </a>
        ,{" "}
        <a
          href="https://www.insee.fr/fr/statistiques/2011101?geo=COM-31555"
          target="_blank"
          rel="noreferrer"
        >
          INSEE · 1968–2023
        </a>
        .
      </p>
      <h3>{t("sourcesDialog.usage")}</h3>
      <p>{t("sourcesDialog.theCompassSwitchesBetweenNorthAndTheVisibleMap")}</p>
      <p>{t("sourcesDialog.onAComputerHoldTheSpaceBarToShow")}</p>
      <h3>{t("sourcesDialog.timelineAndComparison")}</h3>
      <p>{t("sourcesDialog.theTimelineBlendsTheMapsSelectedInEpochsWith")}</p>
      <h3>{t("sourcesDialog.creditsForAllMaps")}</h3>
      <ul className="source-credits">
        {YEARS.map((period) => (
          <li key={period}>
            <a href={sourceUrl(period)} target="_blank" rel="noreferrer">
              {epochLabel(period)} · {mapCredit(period)}
              {getEpoch(period).archiveCredit && ` / ${getEpoch(period).archiveCredit}`}
            </a>
          </li>
        ))}
      </ul>
      <h3>{t("sourcesDialog.theCityToday")}</h3>
      <p>{t("sourcesDialog.openfreemapVectorMapBasedOnOpenstreetmapUpdateDatesVary")}</p>
      <p>
        <a href="https://openfreemap.org/" target="_blank" rel="noreferrer">
          OpenFreeMap
        </a>{" "}
        · ©{" "}
        <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">
          OpenMapTiles
        </a>{" "}
        · ©{" "}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
          OpenStreetMap
        </a>
      </p>
      <h3>{t("sourcesDialog.understandingDifferences")}</h3>
      <p>{t("sourcesDialog.differencesMayReflectChangesInTheCityOrInaccuracies")}</p>
      <h3>{t("sourcesDialog.reusingTheData")}</h3>
      <p>{t("sourcesDialog.theOfficialCatalogueListsTheOpenLicenceV20")}</p>
      <a
        href={`https://data.toulouse-metropole.fr/explore/dataset/parcellaire-de-${year === "1680" ? "1680" : "1830"}/information/`}
        target="_blank"
        rel="noreferrer"
      >
        {t("sourcesDialog.officialCatalogue")} <ExternalLink size={14} />
      </a>
    </>
  );
}
