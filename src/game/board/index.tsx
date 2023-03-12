import { useState, useEffect } from "react";
import { Database, DatabaseReference } from "firebase/database";
import Intersection, { IntersectionType } from './intersection';
import Tile, { tileProps } from "./tile";
import { randomInt } from "../random";

interface boardProps { };

let defaultTerrains = [
    ["mountains", "pasture", "forest"],
    ["fields", "hills", "pasture", "hills"],
    ["fields", "forest", "desert", "forest", "mountains"],
    ["forest", "mountains", "fields", "pasture"],
    ["hills", "fields", "pasture"]
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
    const [terrains, setTerrain] = useState<string[][]>(defaultTerrains);
    const [rolls, setRolls] = useState<number[][]>(defaultRolls);

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
        
        if (y % 2 == 0 && y > 5) {
            if (x == 0) {
                return IntersectionType.right;
            } else if (x == intersections[y] - 1) {
                return IntersectionType.left;
            }
        }

        return y % 2 == 0 ? IntersectionType.fork : IntersectionType.junction;
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
                                        let terrainProps: tileProps = {
                                            terrain: terrain,
                                            roll: rolls[y][x],
                                        };

                                        return <Tile key={`tile-(${x}, ${y})`} {...terrainProps} />
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