export const CITY_EVENTS = [
  {
    year: 418,
    icon: "crown",
    title: "Capitale wisigothique",
    text: "Toulouse devient la capitale du royaume wisigothique. La ville occupe une place majeure dans le sud-ouest de la Gaule.",
    source: "https://metropole.toulouse.fr/sortir/patrimoine/histoire-de-toulouse",
  },
  {
    year: 1218,
    icon: "swords",
    title: "Le siège de Toulouse",
    text: "Pendant la croisade contre les Albigeois, Toulouse résiste au siège de 1217–1218. Simon de Montfort, chef des croisés, meurt sous les murs de la ville en 1218. Cette période de guerre marque profondément son histoire.",
    source: "https://archives.toulouse.fr/histoire-de-toulouse/le-moyen-age",
  },
  {
    year: 1229,
    icon: "school",
    title: "Fondation de l’université",
    text: "L’université de Toulouse est fondée en 1229. Les lieux d’enseignement se répartissent dans la ville ; il ne s’agit pas encore d’un campus unique.",
    source: "https://jacobins.toulouse.fr/fr/offre-pedagogique-enseignants/fondation-universite/",
  },
  {
    year: 1348,
    icon: "plague",
    title: "La Peste Noire",
    text: "La Peste Noire arrive à Toulouse au printemps 1348. La synthèse historique du CHU estime qu’environ 15 à 30 % de la population meurt pendant l’épidémie, jusqu’en 1350. Ce bilan est une estimation historique, pas un décompte exact.",
    source: "https://www.chu-toulouse.fr/IMG/pdf/histoire_la_grave.pdf#page=5",
  },
  {
    year: 1463,
    icon: "flame",
    title: "Le grand incendie",
    text: "Le 7 mai 1463, un incendie se déclare près de la rue Maletache. Attisé par le vent d’autan, il ravage une grande partie du cœur commerçant de Toulouse.",
    source:
      "https://documents.toulouse.fr/AToulouse/atoulouse_fevrier2020/version_accessible/le-grand-incendie-de-1463/patrimoine.html",
  },
  {
    year: 1562,
    icon: "swords",
    title: "Les guerres de Religion",
    text: "En mai 1562, catholiques et protestants s’affrontent à Toulouse. Les violences aboutissent à l’expulsion et au massacre de protestants. La ville devient un bastion catholique dans une région où les protestants contrôlent de nombreuses villes.",
    source:
      "https://www.archives.toulouse.fr/documents/10184/498529/FRAC31555_procedures-alacarte-2022-021.pdf/c0f2ede8-4600-484e-98e9-019f2c05e656#page=2",
  },
  {
    year: 1628,
    icon: "plague",
    title: "La peste de 1628–1631",
    text: "Une nouvelle épidémie de peste frappe Toulouse de 1628 à 1631. La synthèse historique du CHU estime environ 10 000 morts sur cette période pour une population initiale de 50 000 habitants, soit près d’une personne sur cinq. Ce bilan reste approximatif.",
    source: "https://www.chu-toulouse.fr/IMG/pdf/histoire_la_grave.pdf#page=9",
  },
  {
    year: 1681,
    icon: "waves",
    title: "Inauguration du canal du Midi",
    text: "Le canal du Midi est inauguré le 15 mai 1681. Son ouverture au trafic sur la totalité du parcours intervient en 1684 ; le tronçon entre Toulouse et Castelnaudary fonctionnait déjà depuis 1674.",
    source: "https://archives.toulouse.fr/canal-du-midi/",
  },
  {
    year: 1856,
    icon: "train",
    title: "Arrivée du chemin de fer",
    text: "La gare est inaugurée le 16 avril 1856. Le chemin de fer transforme les déplacements et le quartier de Matabiau.",
    source: "https://archives.toulouse.fr/plans-anciens/",
  },
  {
    year: 1875,
    icon: "flood",
    title: "La grande crue",
    text: "Les 23 et 24 juin 1875, une crue catastrophique de la Garonne frappe Toulouse, notamment Saint-Cyprien. Le plan de cette époque montre les zones inondées et les maisons écroulées.",
    source: "https://archives.toulouse.fr/plans-anciens/",
  },
  {
    year: 1917,
    icon: "plane",
    title: "L’essor de l’aéronautique",
    text: "Les usines de Pierre-Georges Latécoère s’installent à Montaudran en 1917. Ce site devient un lieu majeur de l’histoire aéronautique toulousaine.",
    source: "https://metropole.toulouse.fr/sites/toulouse-fr/files/2023-11/tim25_brpages.pdf",
  },
  {
    year: 1993,
    icon: "metro",
    title: "Le premier métro",
    text: "La ligne A du métro est inaugurée le 26 juin 1993. Elle marque une nouvelle étape dans les déplacements à Toulouse.",
    source: "https://tisseo-collectivites.fr/actualites/30-ans-ligne-A",
  },
] as const;

/** Show recent milestones that have already happened in the selected year. */
export function eventsAt(year: number) {
  return CITY_EVENTS.filter((event) => event.year <= year).slice(-3);
}
