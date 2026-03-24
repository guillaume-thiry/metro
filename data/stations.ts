export type Station = {
  name: string;
  lines: number[];
};

export const stations: Station[] = [
  { name: "Châtelet", lines: [1, 4, 7, 11, 14] },
  { name: "Gare du Nord", lines: [4, 5] },
  { name: "Gare de Lyon", lines: [1, 14] },
  { name: "Montparnasse – Bienvenüe", lines: [4, 6, 12, 13] },
  { name: "République", lines: [3, 5, 8, 9, 11] },
  { name: "Nation", lines: [1, 2, 6, 9] },
  { name: "Opéra", lines: [3, 7, 8] },
  { name: "Saint-Lazare", lines: [3, 12, 13, 14] },
  { name: "Bastille", lines: [1, 5, 8] },
  { name: "Barbès – Rochechouart", lines: [2, 4] },
  { name: "Oberkampf", lines: [5, 9] },
  { name: "Strasbourg – Saint-Denis", lines: [4, 8, 9] },
  { name: "Pigalle", lines: [2, 12] },
  { name: "Place de Clichy", lines: [2, 13] },
  { name: "Invalides", lines: [8, 13] },
  { name: "Concorde", lines: [1, 8, 12] },
  { name: "Palais Royal – Musée du Louvre", lines: [1, 7] },
  { name: "Les Halles", lines: [4] },
  { name: "Denfert-Rochereau", lines: [4, 6] },
  { name: "Voltaire", lines: [9] },
];
