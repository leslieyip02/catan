import { Terrain } from "./tile";

let defaultTerrains = [
    [Terrain.mountains, Terrain.pasture, Terrain.forest],
    [Terrain.fields, Terrain.hills, Terrain.pasture, Terrain.hills],
    [Terrain.fields, Terrain.forest, Terrain.desert, Terrain.forest, Terrain.mountains],
    [Terrain.forest, Terrain.mountains, Terrain.fields, Terrain.pasture],
    [Terrain.hills, Terrain.fields, Terrain.pasture]
];

let defaultRolls = [
    [10, 2, 9],
    [12, 6, 4, 10],
    [9, 11, 7, 3, 8],
    [8, 3, 4, 5],
    [5, 6, 11]
];

let defaultColors = [
    "#d82306",
    "#8cda52",
    "#4897f2",
    "#ffff85",
];

export { defaultTerrains, defaultRolls, defaultColors };