import { useState, useEffect } from "react";
import { set, child, onValue, off, Database, DatabaseReference } from "firebase/database";
import { defaultTerrains, defaultRolls, intersectionCounts } from "./data";
import Intersection, { IntersectionType } from "./intersection";
import Tile, { TerrainType } from "./tile";
import { randomInt } from "../random";
import { Resource, ResourceRoll, mapTerrainToResource } from "./resource";

interface BoardProps {
    db: Database;
    userRef: DatabaseReference;
    roomRef: DatabaseReference;
};

interface BoardUpdate {
    type: "settlement" | "city" | "road",
    x: number;
    y: number;
    owner: string;
    color: string;
};

function Board(props: BoardProps) {
    const [terrains, setTerrains] = useState<TerrainType[][]>(defaultTerrains);
    const [rolls, setRolls] = useState<number[][]>(defaultRolls);
    const [started, setStarted] = useState<boolean>(false);

    // TODO: keep track of rolls, resources and players who gain resources from those rolls

    // listen for board updates
    useEffect(() => {
        onValue(child(props.roomRef, "terrains"), (newTerrains) => {
            if (newTerrains.val()) {
                setTerrains(newTerrains.val());
            } else {
                set(child(props.roomRef, "terrains"), terrains);
            }
        });

        onValue(child(props.roomRef, "rolls"), (newRolls) => {
            if (newRolls.val()) {
                setRolls(newRolls.val());
            } else {
                set(child(props.roomRef, "rolls"), rolls);
            }
        });

        // stop listening once the game starts
        onValue(child(props.roomRef, "started"), (started) => {
            if (started.val()) {
                let listeners = ["terrains", "rolls", "started"];
                listeners.forEach((listener) => off(child(props.roomRef, listener)));
                setStarted(true);
            }
        });
    }, []);

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

        set(child(props.roomRef, "terrains"), shuffledTerrains);
        setTerrains(shuffledTerrains);

        set(child(props.roomRef, "rolls"), shuffledRolls);
        setRolls(shuffledRolls);
    }

    function resetBoard() {
        set(child(props.roomRef, "terrains"), defaultTerrains);
        setTerrains(defaultTerrains);

        set(child(props.roomRef, "rolls"), defaultRolls);
        setRolls(defaultRolls);
    }

    function mapIntersectionType(x: number, y: number): IntersectionType {
        if (y == intersectionCounts.length - 1) {
            return IntersectionType.end;
        }

        if (y % 2 == 0 && y >= (intersectionCounts.length / 2)) {
            if (x == 0) {
                return IntersectionType.right;
            } else if (x == intersectionCounts[y] - 1) {
                return IntersectionType.left;
            }
        }

        return y % 2 == 0 ? IntersectionType.fork : IntersectionType.junction;
    }

    function mapRollsToIntersections(x: number, y: number): ResourceRoll[] {
        let resourceRolls: ResourceRoll[] = [];

        // offset of adjacent tiles depends on whether intersections are
        // 1. upper or lower half
        // 2. forks or junctions
        let offsets = y < (intersectionCounts.length / 2)
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
            if (terrain != TerrainType.desert) {
                resourceRolls.push({ [roll]: mapTerrainToResource(terrain) });
            }
        });

        return resourceRolls;
    }

    return (
        <div>
            {
                !started && <div>
                    <button onClick={shuffleBoard}>Shuffle Board</button>
                    <button onClick={resetBoard}>Reset Board</button>
                </div>
            }
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
                        intersectionCounts.map((n, y) => {
                            return <div key={`intersection-row-${y}`} className="board__row">
                                {
                                    Array(n).fill(0).map((_, x) => {
                                        return <Intersection
                                            key={`intersection-(${x}, ${y})`}
                                            x={x}
                                            y={y}
                                            userRef={props.userRef}
                                            roomRef={props.roomRef}
                                            type={mapIntersectionType(x, y)}
                                            resourceRolls={mapRollsToIntersections(x, y)}
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
export { BoardUpdate };