import { TerrainType } from "./tile";

let defaultTerrains = [
    [TerrainType.mountains, TerrainType.pasture, TerrainType.forest],
    [TerrainType.fields, TerrainType.hills, TerrainType.pasture, TerrainType.hills],
    [TerrainType.fields, TerrainType.forest, TerrainType.desert, TerrainType.forest, TerrainType.mountains],
    [TerrainType.forest, TerrainType.mountains, TerrainType.fields, TerrainType.pasture],
    [TerrainType.hills, TerrainType.fields, TerrainType.pasture]
];

let defaultRolls = [
    [10, 2, 9],
    [12, 6, 4, 10],
    [9, 11, 7, 3, 8],
    [8, 3, 4, 5],
    [5, 6, 11]
];

let intersectionCounts = [3, 4, 4, 5, 5, 6, 6, 5, 5, 4, 4, 3];

let userColors = [
    "#d82306",
    "#8cda52",
    "#4897f2",
    "#ffff85",
];

export { defaultTerrains, defaultRolls, intersectionCounts, userColors };