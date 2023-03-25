import { IntersectionType, IntersectionData } from "./";
import { Coordinate } from "../";
import Infrastructure from "../infrastructure";
import { RoadDirection, RoadData } from "../road";
import { HarborDirection, HarborData } from "../harbor";
import Resource from "../../card/resource";

let intersectionCounts = [3, 4, 4, 5, 5, 6, 6, 5, 5, 4, 4, 3];
let halfHeight = intersectionCounts.length / 2;

let defaultHarbours: HarborData[] = [
    {
        direction: HarborDirection.above,
        access: [{ x: 0, y: 0 }, { x: 0, y: 1 }],
        resource: Resource.none,
    },
    {
        direction: HarborDirection.above,
        access: [{ x: 1, y: 0 }, { x: 2, y: 1 }],
        resource: Resource.grain,
    },
    {
        direction: HarborDirection.above,
        access: [{ x: 3, y: 2 }, { x: 4, y: 3 }],
        resource: Resource.ore,
    },
    {
        direction: HarborDirection.left,
        access: [{ x: 0, y: 3 }, { x: 0, y: 4 }],
        resource: Resource.lumber,
    },
    {
        direction: HarborDirection.right,
        access: [{ x: 5, y: 5 }, { x: 5, y: 6 }],
        resource: Resource.none,
    },
    {
        direction: HarborDirection.left,
        access: [{ x: 0, y: 7 }, { x: 0, y: 8 }],
        resource: Resource.brick,
    },
    {
        direction: HarborDirection.below,
        access: [{ x: 3, y: 9 }, { x: 4, y: 8 }],
        resource: Resource.wool,
    },
    {
        direction: HarborDirection.below,
        access: [{ x: 0, y: 11 }, { x: 0, y: 10 }],
        resource: Resource.none,
    },
    {
        direction: HarborDirection.below,
        access: [{ x: 1, y: 11 }, { x: 2, y: 10 }],
        resource: Resource.none,
    },
];

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

function adjacentIntersections(x: number, y: number): Coordinate[] {
    let adjacent: Coordinate[] = [];

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

function roadDestination(x: number, y: number, direction: RoadDirection) {
    let destination: Coordinate = { x: x, y: y + 1 }

    if (direction == RoadDirection.left && y >= halfHeight) {
        destination.x--;
    } else if (direction == RoadDirection.right && y < halfHeight) {
        destination.x++;
    }

    return destination;
}

function intersectionHarbor(x: number, y: number) {
    for (let defaultHarbor of defaultHarbours) {
        if (defaultHarbor.access[0].x === x &&
            defaultHarbor.access[0].y === y) {
            return defaultHarbor;
        }
    }

    return null;
}

let defaultIntersections: IntersectionData[][] = intersectionCounts.map((n, y) => {
    return Array(n).fill(0).map((_, x) => {
        let type = intersectionType(x, y);
        let adjacents = adjacentIntersections(x, y);
        let roads: RoadData[] = intersectionRoads(type).map((direction) => {
            return {
                direction: direction,
                origin: { x: x, y: y },
                destination: roadDestination(x, y, direction),
            };
        });

        let harbor = intersectionHarbor(x, y);

        return {
            type: type,
            adjacents: adjacents,
            roads: roads,
            harbor: harbor,
            infrastructure: Infrastructure.none,
        };
    });
});

export { defaultIntersections };