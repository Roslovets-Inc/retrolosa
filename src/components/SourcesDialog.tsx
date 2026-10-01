import { ExternalLink } from "lucide-react";
import React from "react";

import { EPOCH_IDS as YEARS, getEpoch } from "../epochs/catalog";
import type { EpochId as Year } from "../epochs/catalog";
import { getEpochDetails } from "../epochs/details";
export function SourcesContent({ year }: { year: Year }) {
  const details = getEpochDetails(year);
  const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;
  const sourceUrl = (value: Year) => getEpoch(value).sourceUrl;
  const epochLabel = (value: Year) => getEpoch(value).label;
  const mapCredit = (value: Year) => getEpoch(value).credit;
  return (
    <>
      <div className="eyebrow">SOURCES ET PRÉCISION</div>
      <h2>Cartes de Toulouse</h2>
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
        Ouvrir la carte source <ExternalLink size={14} />
      </a>
      <h3>Population de Toulouse</h3>
      <p>
        Ordres de grandeur de la ville historique, puis de la commune, pas de la métropole. Entre
        les repères documentés, le compteur interpole les valeurs et les arrondit au millier. Les
        estimations anciennes sont incertaines et les périmètres varient. Pour l’Antiquité, le
        repère est d’environ 20 000 habitants ; les variations du haut Moyen Âge ne sont pas
        reconstituées. Après 2023, le dernier recensement est conservé.
      </p>
      <p>
        Sources :{" "}
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
          Recensements historiques
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
      <h3>Utilisation</h3>
      <p>
        Le bouton boussole alterne entre le nord et l’orientation du plan visible : 53° pour 1777 ou
        84° pour 1631. Sur la frise, le plan qui apparaît devient la référence à mi-transition. Les
        autres plans restent orientés au nord. Ces angles approchés facilitent la lecture des
        légendes ; les déformations des anciens plans peuvent subsister.
      </p>
      <p>
        Sur ordinateur, maintenez la barre d’espace pour afficher la carte actuelle. Maintenez le
        bouton avec l’icône œil pour lire les rues actuelles avec une légère superposition
        historique. Relâchez pour revenir à la vue précédente. « Lieux » permet de rejoindre un
        quartier. « Partager » crée un lien vers la vue actuelle, avec les époques et les réglages
        choisis.
      </p>
      <h3>Frise et comparaison</h3>
      <p>
        La frise mélange les cartes sélectionnées dans « Époques » et la carte actuelle. Les outils
        au-dessus permettent de choisir la superposition, le rideau ou la loupe sans changer la
        date. Les sources disponibles sont les reconstructions de la fin de l’Antiquité et du XIIIe
        siècle, les héritages du parcellaire de 1550, les plans de 1631 et 1777, les cadastres de
        1680 et 1830, l’état-major de 1848, les plans de 1860 et 1904, le plan d’inondation de 1875
        et la vue aérienne de 1954. Les positions intermédiaires sont des transitions visuelles, pas
        des reconstitutions de ces années.
      </p>
      <h3>Crédits de toutes les cartes</h3>
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
      <h3>La ville actuelle</h3>
      <p>
        Carte vectorielle OpenFreeMap issue d’OpenStreetMap. La date de mise à jour varie selon les
        objets ; ce n’est pas une photographie de la ville à une date précise.
      </p>
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
      <h3>Comprendre les écarts</h3>
      <p>
        Les écarts peuvent refléter les transformations de la ville ou les imprécisions des
        documents historiques. Pour les cadastres de 1680 et 1830, la précision et les points de
        calage ne sont pas publiés avec les tuiles. La concordance de chaque bâtiment n’est pas
        garantie. Les données anciennes sont absentes hors de leur couverture.
      </p>
      <h3>Réutilisation des données</h3>
      <p>
        Le catalogue officiel indique la Licence Ouverte v2.0 pour les données cadastrales. Les
        conditions propres au rendu et à l’hébergement des tuiles Makina Corpus restent à confirmer.
        Cette version sert à une exploration personnelle du concept ; une diffusion publique
        nécessiterait de clarifier ces conditions ou de produire une couche à partir des données
        ouvertes.
      </p>
      <a
        href={`https://data.toulouse-metropole.fr/explore/dataset/parcellaire-de-${year === "1680" ? "1680" : "1830"}/information/`}
        target="_blank"
        rel="noreferrer"
      >
        Catalogue officiel <ExternalLink size={14} />
      </a>
    </>
  );
}
