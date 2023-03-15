import { IntersectionType, IntersectionData } from "./intersection";
import { RoadDirection, RoadData } from "./road";
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
let halfHeight = intersectionCounts.length / 2;

function intersectionType(x: number, y: number): IntersectionType {
    // bottom level intersections have no roads
    if (y == intersectionCounts.length - 1) {
        return IntersectionType.end;
    }

    // roads in the bottom half join back towards the center
    if (y % 2 == 0 && y >= halfHeight) {
        if (x == 0) {
            return IntersectionType.right;
        } else if (x == intersectionCounts[y] - 1) {
            return IntersectionType.left;
        }
    }

    return y % 2 == 0 ? IntersectionType.fork : IntersectionType.junction;
}

function intersectionRoads(type: IntersectionType): RoadDirection[] {
    switch (type) {
        case IntersectionType.fork:
            return [RoadDirection.left, RoadDirection.right];

        case IntersectionType.junction:
            return [RoadDirection.down];

        case IntersectionType.left:
            return [RoadDirection.left];

        case IntersectionType.right:
            return [RoadDirection.right];

        default:
            return [];
    }
}

function adjacentIntersections(x: number, y: number): { x: number, y: number }[] {
    let adjacent: { x: number, y: number }[] = [];

    if (y % 2 == 0) {
        // all intersections have an intersection above except the top layer
        if (y != 0) {
            adjacent.push({ x: x, y: y - 1 });
        }

        if (y < halfHeight) {
            // top half cascades so don't need to check if x is in bounds for layer below
            adjacent.push({ x: x, y: y + 1 });
            adjacent.push({ x: x + 1, y: y + 1 });
        } else {
            if (x != 0) {
                adjacent.push({ x: x - 1, y: y + 1 });
            }

            if (x < intersectionCounts[y + 1]) {
                adjacent.push({ x: x, y: y + 1 });
            }
        }
    }

    if (y % 2 == 1) {
        // all intersections have an intersection below except the bottom layer
        if (y < intersectionCounts.length - 1) {
            adjacent.push({ x: x, y: y + 1 });
        }

        if (y < halfHeight) {
            if (x != 0) {
                adjacent.push({ x: x - 1, y: y - 1 });
            }

            if (x < intersectionCounts[y - 1]) {
                adjacent.push({ x: x, y: y - 1 });
            }
        } else {
            // bottom half shrinks so don't need to check if x is in bounds for layer above
            adjacent.push({ x: x, y: y - 1 });
            adjacent.push({ x: x + 1, y: y - 1 });
        }
    }

    return adjacent;
}


let defaultIntersections: IntersectionData[][] = intersectionCounts.map((n, y) => {
    return Array(n).fill(0).map((_, x) => {
        let type = intersectionType(x, y);
        let adjacents = adjacentIntersections(x, y);
        let roads: RoadData[] = intersectionRoads(type).map((direction) => {
            let destination = { x: x, y: y + 1 }

            if (direction == RoadDirection.left) {
                destination = y < halfHeight
                    ? { x: x, y: y + 1 }
                    : { x: x - 1, y: y + 1 };
            } else if (direction == RoadDirection.right) {
                destination = y < halfHeight
                    ? { x: x + 1, y: y + 1 }
                    : { x: x, y: y + 1 };
            }

            return {
                direction: direction,
                origin: { x: x, y: y },
                destination: destination,
            };
        });

        return {
            type: type,
            adjacents: adjacents,
            roads: roads,
        };
    });
});

let defaultColors = [
    "#d82306",
    "#8cda52",
    "#4897f2",
    "#ffff85",
];

export { defaultTerrains, defaultRolls, defaultIntersections, defaultColors };