export type Coordinates = [[number, number], [number, number], [number, number], [number, number]];
export type Bounds = [number, number, number, number];

export type ImageRender = { kind: "image"; path: string; coordinates: Coordinates };
export type TileRender = {
  kind: "tiles";
  source: { type: "template"; tiles: string[]; local?: boolean } | { type: "pmtiles"; url: string };
  minzoom?: number;
  maxzoom?: number;
  bounds?: Bounds;
  overview?: { image: ImageRender; switchZoom: number };
};
export type EpochRender = ImageRender | TileRender;

export interface EpochDetails {
  title: string;
  paragraphs: readonly string[];
  links?: readonly { label: string; path?: string; url?: string }[];
}

export interface EpochDefinition {
  id: string;
  label: string;
  optionLabel: string;
  category: string;
  timelineLabel?: string;
  credit: string;
  archiveCredit?: string;
  sourceUrl: string;
  attribution: string;
  bearing: number;
  render: EpochRender;
}

export function readCoordinates(value: number[][]): Coordinates {
  if (
    value.length !== 4 ||
    value.some(
      (point) =>
        point.length !== 2 ||
        !Number.isFinite(point[0]) ||
        !Number.isFinite(point[1]) ||
        Math.abs(point[0]) > 180 ||
        Math.abs(point[1]) > 90,
    )
  )
    throw new Error("Expected four finite longitude/latitude corners");
  return value.map((point) => [point[0], point[1]]) as Coordinates;
}

export function readBounds(value: number[]): Bounds {
  if (
    value.length !== 4 ||
    value.some((number) => !Number.isFinite(number)) ||
    value[0] >= value[2] ||
    value[1] >= value[3] ||
    Math.abs(value[0]) > 180 ||
    Math.abs(value[2]) > 180 ||
    Math.abs(value[1]) > 90 ||
    Math.abs(value[3]) > 90
  )
    throw new Error("Expected ordered west/south/east/north bounds");
  return [value[0], value[1], value[2], value[3]];
}
