import {
  fitPoints as stateMajorFitPoints,
  independentChecks as stateMajorIndependentChecks,
} from "../../data/etat-major-validation.json";
import type { EpochId } from "./catalog";
import { RASTER_ITEMS } from "./raster-items";
import type { EpochDetails } from "./types";

function createEpochDetails(translate: Translate) {
  const cadastralParagraph = translate(
    "details.mapProducedByMakinaCorpusFromToulouseMetropoleS",
    "Carte réalisée par Makina Corpus à partir du cadastre historique de Toulouse Métropole. Il s’agit d’un dessin actuel de données historiques, et non d’un scan d’archive. Les tuiles géoréférencées sont utilisées sans déformation supplémentaire.",
  );
  const planAlignment = (fitPointCount: number, checkPoints: readonly { errorMetres: number }[]) =>
    translate(
      "details.alignmentUsesLandmarksAcrossTheCentreCanalBridgesSaint",
      `Calage sur ${fitPointCount} repères répartis entre le centre, les ponts du canal, Saint-Cyprien et le Grand Rond, dont le bassin central et trois axes de rues autour du parc, avec une correction progressive des déformations du plan. ${checkPoints.length} contrôles indépendants sur des carrefours, églises et places donnent des écarts de ${checkPoints.map((point) => point.errorMetres).join(", ")} m. Ces contrôles concernent le centre ; ils ne garantissent pas la précision aux faubourgs ni aux bords du document. Le feuillet complet est conservé.`,
      {
        v0: fitPointCount,
        v1: checkPoints.length,
        v2: checkPoints.map((point) => point.errorMetres).join(", "),
      },
    );

  const details = {
    "450": {
      title: translate(
        "details.toulouseInLateAntiquityReconstruction",
        "Toulouse à la fin de l’Antiquité · reconstruction",
      ),
      paragraphs: [
        translate(
          "details.figure1FromQuitterieCazesSStudyDrawnBy",
          "Figure 1 de l’étude de Quitterie Cazes, dessin de F. Callède. Le plan distingue les vestiges du Haut et du Bas Empire et les propositions de restitution des axes de la voirie antique. Le fond parcellaire et les églises servent de repères ; tous les éléments dessinés ne sont pas contemporains.",
        ),
        translate(
          "details.theSourceIndicatesLateAntiquityWithoutAPreciseYear",
          `La source indique la fin de l’Antiquité, sans année précise. Le repère 450 dans les liens et la frise sert uniquement au classement. La légende originale est conservée. Le calage affine utilise trois églises de référence ; le contrôle indépendant à Saint-Pierre-des-Cuisines donne un écart d’environ ${RASTER_ITEMS["450"].properties["retrolosa:check_points"][0].errorMetres} m, sans garantir la précision ailleurs.`,
          { v0: RASTER_ITEMS["450"].properties["retrolosa:check_points"][0].errorMetres },
        ),
      ],
      links: [
        {
          path: "openedition-antiquite/figure-01.jpg",
          label: translate(
            "details.viewTheCompleteDrawingAndLegend",
            "Voir le dessin complet et sa légende",
          ),
        },
      ],
    },
    "1195": {
      title: translate(
        "details.toulouseInThe12thCenturyThreeReconstructedAreas",
        "Toulouse au XIIe siècle · trois secteurs reconstruits",
      ),
      paragraphs: [
        translate(
          "details.partialReconstructionFigure9FromQuitterieCazesSStudy",
          "Reconstruction partielle : figure 9 de l’étude de Quitterie Cazes, dessin de F. Callède / Inrap. Le document montre la croissance du bourg vers 1107, vers 1150, après 1150 et son extension après 1191. Les couleurs et la légende distinguent ces phases ; ce n’est pas un état unique de toute la ville.",
        ),
        translate(
          "details.threeSeparateAreasTheSaintSerninBoroughRomanesqueFeatures",
          "Trois secteurs séparés : le bourg Saint-Sernin, les éléments romans du quartier Saint-Étienne et le château Narbonnais de la fin du XIIe siècle. Entre ces fragments, les zones sans documentation restent transparentes. Le fond parcellaire de Saint-Sernin est une analyse du cadastre restitué de 1550. Le repère 1195 sert au classement, sans dater précisément tous les éléments.",
        ),
        translate(
          "details.affineAlignmentTransferredFromThe13thCenturyReconstructionThen",
          `Calage affine transféré depuis la reconstruction du XIIIe siècle, puis corrigé sur la croisée de Saint-Sernin dans le plan IGN actuel. Le contrôle de Saint-Pierre-des-Cuisines sur IGN donne ${RASTER_ITEMS["1195"].properties["retrolosa:check_points"][0].errorMetres} m ; les portes de la Porterie et de Matabiau donnent ${RASTER_ITEMS[
            "1195"
          ].properties["retrolosa:check_points"]
            .slice(1)
            .map((point) => point.errorMetres)
            .join(
              translate("details.and", " et "),
            )} m de désaccord avec le dessin du XIIIe siècle. Ces contrôles ne garantissent pas la précision historique ou la concordance de toutes les rues. Le dessin complet et sa légende sont conservés.`,
          {
            v0: RASTER_ITEMS["1195"].properties["retrolosa:check_points"][0].errorMetres,
            v1: RASTER_ITEMS["1195"].properties["retrolosa:check_points"]
              .slice(1)
              .map((point) => point.errorMetres)
              .join(" et "),
          },
        ),
        translate(
          "details.saintEtienneOnlyRedRomanesqueFeaturesYellowCanonsHouses",
          `Saint-Étienne : seuls les éléments romans rouges, les maisons canoniales jaunes et le palais épiscopal violet sont retenus dans les zones identifiées. L’extension jaune pâle du XIIIe siècle et les éléments gris postérieurs sont exclus. Deux contrôles sur les angles de la cathédrale actuelle donnent ${RASTER_ITEMS["1195"].properties["retrolosa:fragments"][1].checkPoints.map((point) => point.errorMetres).join(translate("details.and", " et "))} m ; ils ne valident pas tout le quartier.`,
          {
            v0: RASTER_ITEMS["1195"].properties["retrolosa:fragments"][1].checkPoints
              .map((point) => point.errorMetres)
              .join(translate("details.and", " et ")),
          },
        ),
        translate(
          "details.narbonnaisCastleApproximatePlacementBasedOnTheCastleSymbol",
          "Château Narbonnais : placement approximatif à partir du symbole du château dans le plan général, du nord et de l’échelle de la figure 11. Ce fragment n’a pas de contrôle topographique indépendant. La porte incertaine et les accès possibles restent signalés ; le fond cadastral n’est pas un état médiéval. Les légendes complètes sont accessibles ci-dessous.",
        ),
        translate(
          "details.saintPierreDesCuisinesFigure3SupplementsTheBorough",
          `Saint-Pierre-des-Cuisines : la figure 3 complète le bourg avec les phases rouges vers 1100 et 1150 et la phase vert clair vers 1180. Le jaune de 1050, le bleu-vert du bas Moyen Âge et les éléments gris postérieurs sont exclus. Les phases sont présentées ensemble pour l’analyse, sans affirmer que tous les murs coexistaient. Deux angles de la nef non utilisés pour le calage donnent ${RASTER_ITEMS["1195"].properties["retrolosa:fragments"][3].checkPoints.map((point) => point.errorMetres).join(translate("details.and", " et "))} m d’écart avec IGN. Ces contrôles locaux ne garantissent pas la précision ailleurs.`,
          {
            v0: RASTER_ITEMS["1195"].properties["retrolosa:fragments"][3].checkPoints
              .map((point) => point.errorMetres)
              .join(translate("details.and", " et ")),
          },
        ),
      ],
      links: [
        {
          path: "openedition-12c/figure-09.jpg",
          label: translate(
            "details.saintSerninGrowthDrawingAndLegend",
            "Croissance de Saint-Sernin · dessin et légende",
          ),
        },
        {
          path: "openedition-12c/figure-11.jpg",
          label: translate(
            "details.narbonnaisCastleDrawingAndLegend",
            "Château Narbonnais · dessin et légende",
          ),
        },
        {
          path: "openedition-12c/figure-04.jpg",
          label: translate(
            "details.saintEtiennePhasesAndLegend",
            "Saint-Étienne · phases et légende",
          ),
        },
        {
          path: "openedition-12c/figure-03.jpg",
          label: translate(
            "details.saintPierreDesCuisinesPhasesAndLegend",
            "Saint-Pierre-des-Cuisines · phases et légende",
          ),
        },
      ],
    },
    "1250": {
      title: translate(
        "details.toulouseInThe13thCenturyReconstruction",
        "Toulouse au XIIIe siècle · reconstruction",
      ),
      paragraphs: [
        translate(
          "details.drawingByFCalledeInrapPcrToulouseAuMoyen",
          "Dessin de F. Callède, Inrap, PCR « Toulouse au Moyen Âge », illustration 6 de l’étude de Quitterie Cazes publiée dans Marquer la ville (2013), sur OpenEdition. Les positions connues et proposées sont distinguées dans la légende originale. Le fond parcellaire est un repère de lecture, pas un relevé exact du XIIIe siècle.",
        ),
        translate(
          "details.affineAlignmentOnSaintSerninSaintEtienneAndLa",
          `Calage affine sur Saint-Sernin, Saint-Étienne et la Dalbade. Un contrôle indépendant à Saint-Pierre-des-Cuisines donne un écart d’environ ${RASTER_ITEMS["1250"].properties["retrolosa:check_points"][0].errorMetres} m, sans garantir la précision ailleurs. La légende originale est conservée sur la carte. Le repère 1250 dans les liens et la frise sert au classement ; la source date le plan du XIIIe siècle, sans année précise.`,
          { v0: RASTER_ITEMS["1250"].properties["retrolosa:check_points"][0].errorMetres },
        ),
      ],
      links: [
        {
          path: "openedition-13c/figure-06.jpg",
          label: translate(
            "details.viewTheCompleteDrawingAndLegend",
            "Voir le dessin complet et sa légende",
          ),
        },
      ],
    },
    "1550": {
      title: translate("details.1550ParcelBoundaryHeritage", "1550 · Héritages du parcellaire"),
      paragraphs: [
        translate(
          "details.compositeOfFigures7And8FromQuitterieCazes",
          "Assemblage des figures 7 et 8 de l’étude de Quitterie Cazes, dessins de F. Callède / Inrap. Les limites rouges de la figure 7, d’orientation antique, complètent les limites bleues de la figure 8. Le fond et la légende de la figure 8 sont conservés ; le fond archéologique propre à la figure 7 reste dans l’original.",
        ),
        translate(
          "details.1550DatesTheReconstructedCadastreUsedForAnalysisStreets",
          `1550 date le cadastre restitué qui sert à l’analyse. Les rues et édifices du fond représentent notamment les XIIe et XIIIe siècles : ce n’est pas un état complet de Toulouse en 1550. Le calage utilise trois églises ; le contrôle indépendant à Saint-Pierre-des-Cuisines donne un écart d’environ ${RASTER_ITEMS["1550"].properties["retrolosa:check_points"][0].errorMetres} m, sans garantir la précision ailleurs.`,
          { v0: RASTER_ITEMS["1550"].properties["retrolosa:check_points"][0].errorMetres },
        ),
      ],
      links: [
        {
          path: "openedition-1550/figure-07.jpg",
          label: translate("details.figure7AncientHeritage", "Figure 7 · Héritages antiques"),
        },
        {
          path: "openedition-1550/figure-08.jpg",
          label: translate("details.figure8MedievalHeritage", "Figure 8 · Héritages médiévaux"),
        },
      ],
    },
    "1631": {
      title: translate("details.melchiorTavernierSPlan1631", "Plan de Melchior Tavernier · 1631"),
      paragraphs: [
        translate(
          "details.planDeLaVilleDeTholoseArchivesMunicipalesDe",
          "Plan de la ville de Tholose, Archives municipales de Toulouse, II 671. Numérisation originale de 7874 × 5884 pixels, domaine public.",
        ),
        translate(
          "details.revisedAlignmentOn22GroundLandmarksWithALocal",
          "Calage révisé sur 22 repères au sol, avec une correction locale de la rue Nazareth. Quatre contrôles distincts autour de Nazareth et du Salin donnent des écarts de 8 à 39 m, sans établir la précision de toute la ville. Les monuments sont dessinés en perspective ; les toits et les bords restent moins fiables. Ce plan ne garantit pas une correspondance exacte rue par rue.",
        ),
        translate(
          "details.theCompleteSheetPreservesItsMarginsCartoucheAndLegend",
          "Le feuillet complet conserve ses marges, son cartouche et sa légende.",
        ),
      ],
      links: [
        {
          path: "tavernier-1631/original.jpg",
          label: translate(
            "details.viewTheCompletePlanAndLegend",
            "Voir le plan complet et sa légende",
          ),
        },
      ],
    },
    "1680": {
      title: translate("details.around1680", "Vers 1680"),
      paragraphs: [cadastralParagraph],
    },
    "1777": {
      title: translate(
        "details.josephMarieDeSagetSPlan1777",
        "Plan de Joseph Marie de Saget · 1777",
      ),
      paragraphs: [
        translate(
          "details.planDeLaVilleDeToulouseDedieEtPresente",
          "Plan de la ville de Toulouse dédié et présenté à Monsieur le frère du Roi. Dessin de Joseph Marie de Saget, gravure de Pierre Gabriel Berthault. Archives municipales de Toulouse, II 686 · domaine public. Numérisation originale de 5906 × 4047 pixels.",
        ),
        translate(
          "details.theCompletePlanPreservesItsTablesAndLegendManual",
          `Le plan complet conserve ses tables et sa légende. Calage affine manuel sur Saint-Sernin, Saint-Étienne et la rive droite du Pont Neuf. Deux contrôles distincts donnent des écarts de ${RASTER_ITEMS["1777"].properties["retrolosa:check_points"].map((point) => point.errorMetres).join(translate("details.and", " et "))} m. Ces repères ne garantissent pas la précision ailleurs ; la correspondance des rues reste approximative, surtout aux bords.`,
          {
            v0: RASTER_ITEMS["1777"].properties["retrolosa:check_points"]
              .map((point) => point.errorMetres)
              .join(translate("details.and", " et ")),
          },
        ),
      ],
      links: [
        {
          path: "saget-1777/original.jpg",
          label: translate(
            "details.viewTheCompletePlanAndLegend",
            "Voir le plan complet et sa légende",
          ),
        },
      ],
    },
    "1830": {
      title: translate("details.1830Cadastre", "Cadastre de 1830"),
      paragraphs: [cadastralParagraph],
    },
    "1848": {
      title: translate("details.etatMajorMap1848", "Carte de l’état-major · 1848"),
      paragraphs: [
        translate(
          "details.colourManuscriptSheetsAt140000DistributedBy",
          "Minutes en couleurs au 1 : 40 000, diffusées par IGN. Le catalogue officiel date de 1848 le feuillet 230 NO qui couvre le centre de Toulouse, ainsi que les cinq feuillets voisins intersectant notre zone de navigation. La période « 1820–1866 » désigne la série nationale, pas la date de Toulouse.",
        ),
        translate(
          "details.1848IsTheManuscriptDateInTheCatalogueLater",
          "Le millésime 1848 est celui des minutes dans le catalogue. Des compléments ultérieurs, notamment ferroviaires, peuvent figurer dans cette série : chaque objet dessiné n’est donc pas nécessairement un état de 1848. La carte montre surtout le territoire, les routes, les cultures et les villages autour de la ville ; elle ne donne pas la précision d’un cadastre parcellaire.",
        ),
        translate(
          "details.ignGeoreferencingRefinedOnRetainedLandmarksJunctionsBridgesMonuments",
          `Géoréférencement IGN affiné sur ${stateMajorFitPoints} repères conservés : carrefours, ponts, monuments et axes autour du Grand Rond. ${stateMajorIndependentChecks.length} contrôles indépendants vérifient ce recalage progressif dans le centre. Les tuiles couvrent les niveaux de zoom 6 à 15 ; au-delà, elles sont agrandies. Source IGN, Licence Ouverte 2.0 ; métadonnées vérifiées le 1er octobre 2026.`,
          { v0: stateMajorFitPoints, v1: stateMajorIndependentChecks.length },
        ),
      ],
      links: [
        {
          url: "https://www.data.gouv.fr/datasets/scan-etat-major-r-40k-1",
          label: translate("details.ignCatalogueAndLicence", "Catalogue IGN et licence"),
        },
      ],
    },
    "1860": {
      title: translate(
        "details.jourdanAndRiviereSPlanAround1860",
        "Plan de Jourdan et Rivière · vers 1860",
      ),
      paragraphs: [
        translate(
          "details.villeDeToulouseFaubourgsBanlieueDrawingByJustinJourdan",
          "Ville de Toulouse. Faubourgs. Banlieue. Dessin de Justin Jourdan, lithographie de Prosper Rivière. Archives municipales de Toulouse, 20 Fi 66 · domaine public.",
        ),
        translate(
          "details.thePlanShowsTheRailwaySquaresAndSuburbsIt",
          "Le plan montre le chemin de fer, les places et les faubourgs. Il comprend des changements réalisés et des alignements officiellement projetés, à distinguer avec la légende. Les cartes annexes et les vues de monuments sont conservées.",
        ),
        planAlignment(
          RASTER_ITEMS["1860"].properties["retrolosa:fit_point_count"],
          RASTER_ITEMS["1860"].properties["retrolosa:check_points"],
        ),
      ],
      links: [
        {
          path: "jourdan-1860/original.jpg",
          label: translate("details.viewTheCompletePlan", "Voir le plan complet"),
        },
      ],
    },
    "1875": {
      title: translate("details.floodOf2324June1875", "Inondation des 23–24 juin 1875"),
      paragraphs: [
        translate(
          "details.originalSirvenLaDepechePlanArchivesMunicipalesDeToulouse",
          "Plan original Sirven / La Dépêche, Archives municipales de Toulouse, 20 Fi 45. Numérisation disponible sur Mapas Milhaud. Le bleu indique les zones inondées ; le rouge, les maisons écroulées.",
        ),
        translate(
          "details.thePlanWasManuallyAlignedOn15LandmarksAt",
          "Le plan a été calé manuellement sur 15 repères. Sur trois points de contrôle indépendants, les écarts sont de 14 à 27 m. La précision diminue aux bords. Ce document historique ne décrit pas le risque actuel d’inondation.",
        ),
      ],
    },
    "1904": {
      title: translate("details.leonLaffontSPlan1904", "Plan de Léon Laffont · 1904"),
      paragraphs: [
        translate(
          "details.planDeLaVilleDeToulouseDrawingByLeon",
          "Plan de la ville de Toulouse. Dessin de Léon Laffont, lithographie de Pierre Rouy, édition Pagès et Carrère. Archives municipales de Toulouse, 20Fi57. Tirage de 1904.",
        ),
        translate(
          "details.thePlanCoversTheCentreAndSuburbsIncludingMinimes",
          "Le plan couvre le centre et les faubourgs, notamment les Minimes, Bonnefoy, Saint-Cyprien et Saint-Michel. Le pont des Amidonniers y figure comme projet. Les numéros de grille, le titre et les marges sont conservés.",
        ),
        planAlignment(
          RASTER_ITEMS["1904"].properties["retrolosa:fit_point_count"],
          RASTER_ITEMS["1904"].properties["retrolosa:check_points"],
        ),
      ],
      links: [
        {
          path: "laffont-1904/original.jpg",
          label: translate("details.viewTheCompletePlan", "Voir le plan complet"),
        },
      ],
    },
    "1954": {
      title: translate("details.1954AerialView", "Vue aérienne de 1954"),
      paragraphs: [
        translate(
          "details.blackAndWhiteAerialPhotographSuppliedByIgnEdugeo",
          "Photographie aérienne en noir et blanc fournie par IGN / Edugéo, déjà géoréférencée. À fort zoom, les pixels du cliché deviennent visibles. Hors couverture, la carte actuelle reste affichée.",
        ),
      ],
    },
  } satisfies Record<EpochId, EpochDetails>;

  return details;
}

type Translate = (key: string, fallback: string, values?: Record<string, unknown>) => string;
export const epochDetails = createEpochDetails((_key, fallback) => fallback);

export function getEpochDetails(id: EpochId, translate?: Translate): EpochDetails {
  return translate ? createEpochDetails(translate)[id] : epochDetails[id];
}
