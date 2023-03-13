import { useState, useEffect } from "react";
import { Database, DatabaseReference } from "firebase/database";
import Intersection, { IntersectionType } from './intersection';
import Tile, { TerrainType } from "./tile";
import { randomInt } from "../random";
import { Resource, mapTerrainToResource, resourceRoll } from "./resource";

interface boardProps { };

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

let intersections = [3, 4, 4, 5, 5, 6, 6, 5, 5, 4, 4, 3];

function Board(props: boardProps) {
    const [terrains, setTerrain] = useState<TerrainType[][]>(defaultTerrains);
    const [rolls, setRolls] = useState<number[][]>(defaultRolls);

    // TODO: keep track of rolls, resources and players who gain resources from those rolls

    function shuffleBoard() {
        let shuffledTerrains = terrains.map((row) => row.slice());
        let shuffledRolls = rolls.map((row) => row.slice());

        for (let shuffleCount = randomInt(1, 50); shuffleCount > 0; shuffleCount--) {
            let y1 = randomInt(0, shuffledTerrains.length);
            let x1 = randomInt(0, shuffledTerrains[y1].length);
            let y2 = randomInt(0, shuffledTerrains.length);
            let x2 = randomInt(0, shuffledTerrains[y2].length);

            let t1 = shuffledTerrains[y1][x1];
            shuffledTerrains[y1][x1] = shuffledTerrains[y2][x2];
            shuffledTerrains[y2][x2] = t1;

            // rolls need to be swapped for desert because of robber
            if (shuffledTerrains[y1][x1] === "desert" ||
                shuffledTerrains[y2][x2] === "desert") {

                let r1 = shuffledRolls[y1][x1];
                shuffledRolls[y1][x1] = shuffledRolls[y2][x2];
                shuffledRolls[y2][x2] = r1;
            }
        }

        for (let shuffleCount = randomInt(1, 50); shuffleCount > 0; shuffleCount--) {
            let y1 = randomInt(0, shuffledRolls.length);
            let x1 = randomInt(0, shuffledRolls[y1].length);
            let y2 = randomInt(0, shuffledRolls.length);
            let x2 = randomInt(0, shuffledRolls[y2].length);

            // skip desert because of robber
            if (shuffledRolls[y1][x1] === 7 ||
                shuffledRolls[y2][x2] === 7) {

                continue;
            }

            let t1 = shuffledRolls[y1][x1];
            shuffledRolls[y1][x1] = shuffledRolls[y2][x2];
            shuffledRolls[y2][x2] = t1;
        }

        setTerrain(shuffledTerrains);
        setRolls(shuffledRolls);
    }

    function resetBoard() {
        setTerrain(defaultTerrains);
        setRolls(defaultRolls);
    }

    function intersectionType(x: number, y: number): IntersectionType {
        if (y == intersections.length - 1) {
            return IntersectionType.end;
        }

        if (y % 2 == 0 && y >= (intersections.length / 2)) {
            if (x == 0) {
                return IntersectionType.right;
            } else if (x == intersections[y] - 1) {
                return IntersectionType.left;
            }
        }

        return y % 2 == 0 ? IntersectionType.fork : IntersectionType.junction;
    }

    function intersectionResourceRolls(x: number, y: number): resourceRoll[] {
        let resourceRolls: resourceRoll[] = [];

        // offset of adjacent tiles depends on whether intersections are
        // 1. upper or lower half
        // 2. forks or junctions
        let offsets = y < (intersections.length / 2)
            ? (y % 2 == 0 ? [[-1, -1], [0, -1], [0, 0]] : [[-1, -1], [-1, 0], [0, 0]])
            : (y % 2 == 0 ? [[-1, -1], [0, -1], [-1, 0]] : [[0, -1], [-1, 0], [0, 0]]);

        y = Math.floor(y / 2);
        offsets.forEach((offset) => {
            let ox = x + offset[0];
            let oy = y + offset[1];

            // check if in range
            if (oy < 0 || oy >= defaultRolls.length ||
                ox < 0 || ox >= defaultRolls[oy].length) {

                return;
            }

            let terrain = terrains[oy][ox];
            let roll = rolls[oy][ox];
            resourceRolls.push({ [roll]: mapTerrainToResource(terrain) });
        });

        return resourceRolls;
    }

    return (
        <div>
            <button onClick={shuffleBoard}>Shuffle Board</button>
            <button onClick={resetBoard}>Reset Board</button>
            <div className="board">
                <div className="board__layer board__tiles">
                    {
                        terrains.map((row, y) => {
                            return <div key={`tile-row-${y}`} className="board__row">
                                {
                                    row.map((terrain, x) => {
                                        return <Tile key={`tile-(${x}, ${y})`}
                                            terrain={terrain}
                                            roll={rolls[y][x]}
                                        />
                                    })
                                }
                            </div>
                        })
                    }
                </div>
                <div className="board__layer board__paths">
                    {
                        intersections.map((n, y) => {
                            return <div key={`intersection-row-${y}`} className="board__row">
                                {
                                    Array(n).fill(0).map((_, x) => {
                                        return <Intersection
                                            key={`intersection-(${x}, ${y})`}
                                            type={intersectionType(x, y)}
                                            resourceRolls={intersectionResourceRolls(x, y)}
                                        />
                                    })
                                }
                            </div>
                        })
                    }
                </div>
            </div>
        </div>
    );
}

export default Board;