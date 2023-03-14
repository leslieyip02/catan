import { IntersectionType } from "./intersection";
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

function mapIntersectionType(x: number, y: number): IntersectionType {
    // bottom level intersections have no roads
    if (y == intersectionCounts.length - 1) {
        return IntersectionType.end;
    }

    // roads in the bottom half join back towards the center
    if (y % 2 == 0 && y >= (intersectionCounts.length / 2)) {
        if (x == 0) {
            return IntersectionType.right;
        } else if (x == intersectionCounts[y] - 1) {
            return IntersectionType.left;
        }
    }

    return y % 2 == 0 ? IntersectionType.fork : IntersectionType.junction;
}

let defaultIntersections = intersectionCounts.map((n, y) => {
    return Array(n).fill(0).map((_, x) => {
        return { type: mapIntersectionType(x, y) };
    });
});

let defaultColors = [
    "#d82306",
    "#8cda52",
    "#4897f2",
    "#ffff85",
];

export { defaultTerrains, defaultRolls, defaultIntersections, defaultColors };