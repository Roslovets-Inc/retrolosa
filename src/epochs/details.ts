import stateMajorReport from "../../data/etat-major-validation.json";
import jourdan from "../jourdan-1860.json";
import laffont from "../laffont-1904.json";
import medieval from "../openedition-13c.json";
import parcels from "../openedition-1550.json";
import antiquity from "../openedition-antiquite.json";
import saget from "../saget-1777.json";
import type { EpochDetails } from "./types";

const cadastralParagraph =
  "Carte réalisée par Makina Corpus à partir du cadastre historique de Toulouse Métropole. Il s’agit d’un dessin actuel de données historiques, et non d’un scan d’archive. Les tuiles géoréférencées sont utilisées sans déformation supplémentaire.";
const planAlignment = (metadata: typeof jourdan) =>
  `Calage sur ${metadata.fitPointCount} repères répartis entre le centre, les ponts du canal, Saint-Cyprien et le Grand Rond, dont le bassin central et trois axes de rues autour du parc, avec une correction progressive des déformations du plan. ${metadata.checkPoints.length} contrôles indépendants sur des carrefours, églises et places donnent des écarts de ${metadata.checkPoints.map((point) => point.errorMetres).join(", ")} m. Ces contrôles concernent le centre ; ils ne garantissent pas la précision aux faubourgs ni aux bords du document. Le feuillet complet est conservé.`;

export const epochDetails = {
  "450": {
    title: "Toulouse à la fin de l’Antiquité · reconstruction",
    paragraphs: [
      "Figure 1 de l’étude de Quitterie Cazes, dessin de F. Callède. Le plan distingue les vestiges du Haut et du Bas Empire et les propositions de restitution des axes de la voirie antique. Le fond parcellaire et les églises servent de repères ; tous les éléments dessinés ne sont pas contemporains.",
      `La source indique la fin de l’Antiquité, sans année précise. Le repère 450 dans les liens et la frise sert uniquement au classement. La légende originale est conservée. Le calage affine utilise trois églises de référence ; le contrôle indépendant à Saint-Pierre-des-Cuisines donne un écart d’environ ${antiquity.checkPoints[0].errorMetres} m, sans garantir la précision ailleurs.`,
    ],
    links: [
      {
        path: "openedition-antiquite/figure-01.jpg",
        label: "Voir le dessin complet et sa légende",
      },
    ],
  },
  "1250": {
    title: "Toulouse au XIIIe siècle · reconstruction",
    paragraphs: [
      "Dessin de F. Callède, Inrap, PCR « Toulouse au Moyen Âge », illustration 6 de l’étude de Quitterie Cazes publiée dans Marquer la ville (2013), sur OpenEdition. Les positions connues et proposées sont distinguées dans la légende originale. Le fond parcellaire est un repère de lecture, pas un relevé exact du XIIIe siècle.",
      `Calage affine sur Saint-Sernin, Saint-Étienne et la Dalbade. Un contrôle indépendant à Saint-Pierre-des-Cuisines donne un écart d’environ ${medieval.checkPoints[0].errorMetres} m, sans garantir la précision ailleurs. La légende originale est conservée sur la carte. Le repère 1250 dans les liens et la frise sert au classement ; la source date le plan du XIIIe siècle, sans année précise.`,
    ],
    links: [
      { path: "openedition-13c/figure-06.jpg", label: "Voir le dessin complet et sa légende" },
    ],
  },
  "1550": {
    title: "1550 · Héritages du parcellaire",
    paragraphs: [
      "Assemblage des figures 7 et 8 de l’étude de Quitterie Cazes, dessins de F. Callède / Inrap. Les limites rouges de la figure 7, d’orientation antique, complètent les limites bleues de la figure 8. Le fond et la légende de la figure 8 sont conservés ; le fond archéologique propre à la figure 7 reste dans l’original.",
      `1550 date le cadastre restitué qui sert à l’analyse. Les rues et édifices du fond représentent notamment les XIIe et XIIIe siècles : ce n’est pas un état complet de Toulouse en 1550. Le calage utilise trois églises ; le contrôle indépendant à Saint-Pierre-des-Cuisines donne un écart d’environ ${parcels.checkPoints[0].errorMetres} m, sans garantir la précision ailleurs.`,
    ],
    links: [
      { path: "openedition-1550/figure-07.jpg", label: "Figure 7 · Héritages antiques" },
      { path: "openedition-1550/figure-08.jpg", label: "Figure 8 · Héritages médiévaux" },
    ],
  },
  "1631": {
    title: "Plan de Melchior Tavernier · 1631",
    paragraphs: [
      "Plan de la ville de Tholose, Archives municipales de Toulouse, II 671. Numérisation originale de 7874 × 5884 pixels, domaine public.",
      "Calage révisé sur 22 repères au sol, avec une correction locale de la rue Nazareth. Quatre contrôles distincts autour de Nazareth et du Salin donnent des écarts de 8 à 39 m, sans établir la précision de toute la ville. Les monuments sont dessinés en perspective ; les toits et les bords restent moins fiables. Ce plan ne garantit pas une correspondance exacte rue par rue.",
      "Le feuillet complet conserve ses marges, son cartouche et sa légende.",
    ],
    links: [{ path: "tavernier-1631/original.jpg", label: "Voir le plan complet et sa légende" }],
  },
  "1680": { title: "Vers 1680", paragraphs: [cadastralParagraph] },
  "1777": {
    title: "Plan de Joseph Marie de Saget · 1777",
    paragraphs: [
      "Plan de la ville de Toulouse dédié et présenté à Monsieur le frère du Roi. Dessin de Joseph Marie de Saget, gravure de Pierre Gabriel Berthault. Archives municipales de Toulouse, II 686 · domaine public. Numérisation originale de 5906 × 4047 pixels.",
      `Le plan complet conserve ses tables et sa légende. Calage affine manuel sur Saint-Sernin, Saint-Étienne et la rive droite du Pont Neuf. Deux contrôles distincts donnent des écarts de ${saget.checkPoints.map((point) => point.errorMetres).join(" et ")} m. Ces repères ne garantissent pas la précision ailleurs ; la correspondance des rues reste approximative, surtout aux bords.`,
    ],
    links: [{ path: "saget-1777/original.jpg", label: "Voir le plan complet et sa légende" }],
  },
  "1830": { title: "Cadastre de 1830", paragraphs: [cadastralParagraph] },
  "1848": {
    title: "Carte de l’état-major · 1848",
    paragraphs: [
      "Minutes en couleurs au 1 : 40 000, diffusées par IGN. Le catalogue officiel date de 1848 le feuillet 230 NO qui couvre le centre de Toulouse, ainsi que les cinq feuillets voisins intersectant notre zone de navigation. La période « 1820–1866 » désigne la série nationale, pas la date de Toulouse.",
      "Le millésime 1848 est celui des minutes dans le catalogue. Des compléments ultérieurs, notamment ferroviaires, peuvent figurer dans cette série : chaque objet dessiné n’est donc pas nécessairement un état de 1848. La carte montre surtout le territoire, les routes, les cultures et les villages autour de la ville ; elle ne donne pas la précision d’un cadastre parcellaire.",
      `Géoréférencement IGN affiné sur ${stateMajorReport.fitPoints} repères conservés : carrefours, ponts, monuments et axes autour du Grand Rond. ${stateMajorReport.independentChecks.length} contrôles indépendants vérifient ce recalage progressif dans le centre. Les tuiles couvrent les niveaux de zoom 6 à 15 ; au-delà, elles sont agrandies. Source IGN, Licence Ouverte 2.0 ; métadonnées vérifiées le 1er octobre 2026.`,
    ],
    links: [
      {
        url: "https://www.data.gouv.fr/datasets/scan-etat-major-r-40k-1",
        label: "Catalogue IGN et licence",
      },
    ],
  },
  "1860": {
    title: "Plan de Jourdan et Rivière · vers 1860",
    paragraphs: [
      "Ville de Toulouse. Faubourgs. Banlieue. Dessin de Justin Jourdan, lithographie de Prosper Rivière. Archives municipales de Toulouse, 20 Fi 66 · domaine public.",
      "Le plan montre le chemin de fer, les places et les faubourgs. Il comprend des changements réalisés et des alignements officiellement projetés, à distinguer avec la légende. Les cartes annexes et les vues de monuments sont conservées.",
      planAlignment(jourdan),
    ],
    links: [{ path: "jourdan-1860/original.jpg", label: "Voir le plan complet" }],
  },
  "1875": {
    title: "Inondation des 23–24 juin 1875",
    paragraphs: [
      "Plan original Sirven / La Dépêche, Archives municipales de Toulouse, 20 Fi 45. Numérisation disponible sur Mapas Milhaud. Le bleu indique les zones inondées ; le rouge, les maisons écroulées.",
      "Le plan a été calé manuellement sur 15 repères. Sur trois points de contrôle indépendants, les écarts sont de 14 à 27 m. La précision diminue aux bords. Ce document historique ne décrit pas le risque actuel d’inondation.",
    ],
  },
  "1904": {
    title: "Plan de Léon Laffont · 1904",
    paragraphs: [
      "Plan de la ville de Toulouse. Dessin de Léon Laffont, lithographie de Pierre Rouy, édition Pagès et Carrère. Archives municipales de Toulouse, 20Fi57. Tirage de 1904.",
      "Le plan couvre le centre et les faubourgs, notamment les Minimes, Bonnefoy, Saint-Cyprien et Saint-Michel. Le pont des Amidonniers y figure comme projet. Les numéros de grille, le titre et les marges sont conservés.",
      planAlignment(laffont),
    ],
    links: [{ path: "laffont-1904/original.jpg", label: "Voir le plan complet" }],
  },
  "1954": {
    title: "Vue aérienne de 1954",
    paragraphs: [
      "Photographie aérienne en noir et blanc fournie par IGN / Edugéo, déjà géoréférencée. À fort zoom, les pixels du cliché deviennent visibles. Hors couverture, la carte actuelle reste affichée.",
    ],
  },
} satisfies Record<string, EpochDetails>;
