import { useState, useEffect, useRef } from "react";
import { set, child, onValue, Database, DatabaseReference } from 'firebase/database';
import { defaultTerrains, defaultRolls } from "./default";
import Infrastructure, { defaultInfrastructure, InfrastructureQuota } from "./infrastructure";
import Intersection, { IntersectionData, defaultIntersections } from "./intersection";
import { randomInt } from "../random";
import { ResourceRoll, mapTerrainToResource } from "../card/resource";
import { RoadDirection } from "./road";
import Tile, { Terrain } from "./tile";
import { CardHand } from "../card/hand";

interface Coordinate {
    x: number,
    y: number,
}

interface BoardProps {
    db: Database;
    userRef: DatabaseReference;
    roomRef: DatabaseReference;
    started: boolean;
    playerTurn: boolean;
    setupTurn: boolean;
    cards: React.MutableRefObject<CardHand>;
    quota: React.MutableRefObject<InfrastructureQuota>;
    robber?: Coordinate;
    rolled: boolean;
    canPlaceRobber: boolean;
    needToSteal: boolean;
    allDiscarded: boolean;
    ongoingTrade: boolean;
    endTurn: () => void;
    placeRobber?: (x: number, y: number) => void;
};

interface BoardUpdate {
    infrastructure: Infrastructure;
    x: number;
    y: number;
    owner: string;
    color: string;
    roadDirection?: RoadDirection;
};

const Board = (props: BoardProps) => {
    const [terrains, setTerrains] = useState<Terrain[][]>(defaultTerrains);
    const [rolls, setRolls] = useState<number[][]>(defaultRolls);
    const [intersections, setIntersections] = useState<IntersectionData[][]>(defaultIntersections);

    useEffect(() => {
        // listen for board shuffles
        onValue(child(props.roomRef, "terrains"), (newTerrains) => {
            if (newTerrains.val()) {
                setTerrains(newTerrains.val());
            }
        });

        onValue(child(props.roomRef, "rolls"), (newRolls) => {
            if (newRolls.val()) {
                setRolls(newRolls.val());
            }
        });

        // listen for board updates
        onValue(child(props.roomRef, "boardUpdate"), (update) => {
            let boardUpdate: BoardUpdate = update.val();
            if (boardUpdate) {
                let { infrastructure, x, y, owner, color } = boardUpdate;
                let updatedIntersections = intersections.map((row) => row.slice());

                if (infrastructure == Infrastructure.road) {
                    // check for the correct road to update
                    for (let i = 0; i < updatedIntersections[y][x].roads.length; i++) {
                        if (updatedIntersections[y][x].roads[i].direction == boardUpdate.roadDirection) {
                            updatedIntersections[y][x].roads[i].owner = owner;
                            updatedIntersections[y][x].roads[i].color = color;
                            break;
                        }
                    }
                } else {
                    updatedIntersections[y][x].owner = owner;
                    updatedIntersections[y][x].color = color;
                    updatedIntersections[y][x].infrastructure = infrastructure;
                }

                setIntersections(updatedIntersections);
            }
        });
    }, []);

    function mapRollsToIntersections(x: number, y: number): ResourceRoll[] {
        let resourceRolls: ResourceRoll[] = [];

        // offset of adjacent tiles depends on whether intersections are
        // 1. upper or lower half
        // 2. forks or junctions
        let offsets = y < (defaultIntersections.length / 2)
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
            if (terrain != Terrain.desert) {
                resourceRolls.push({
                    [roll]: mapTerrainToResource(terrain),
                    tile: { x: ox, y: oy },
                });
            }
        });

        return resourceRolls;
    }

    function tileProps(terrain: Terrain, x: number, y: number) {
        let robber = props.robber && x === props.robber.x && y === props.robber.y;
        let placeRobber = props.placeRobber ? () => props.placeRobber(x, y) : null;

        return {
            terrain: terrain,
            roll: rolls[y][x],
            robber: robber,
            placeRobber: placeRobber,
        };
    }

    function intersectionProps(x: number, y: number) {
        return {
            x: x,
            y: y,
            resourceRolls: mapRollsToIntersections(x, y),
            lookUp: (x: number, y: number) => intersections[y][x],
        };
    }

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

            let r1 = shuffledRolls[y1][x1];
            shuffledRolls[y1][x1] = shuffledRolls[y2][x2];
            shuffledRolls[y2][x2] = r1;
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

    const ShuffleButton = () => {
        return (
            <i className="board__button fa-solid fa-shuffle" onClick={shuffleBoard}>
                <span className="tooltip">Shuffle</span>
            </i>
        );
    }

    const ResetButton = () => {
        return (
            <i className="board__button fa-solid fa-arrow-rotate-left" onClick={resetBoard}>
                <span className="tooltip">Reset</span>
            </i>
        );
    }

    return (
        <div className="board">
            {
                !props.started && <div className="board__layer board__buttons">
                    <div>
                        <ShuffleButton />
                        <ResetButton />
                    </div>
                </div>
            }
            <div className="board__layer board__tiles">
                {
                    terrains.map((row, y) => {
                        return <div key={`tile-row-${y}`} className="board__row">
                            {
                                row.map((terrain, x) => {
                                    return <Tile
                                        key={`tile-(${x}, ${y})`}
                                        {...tileProps(terrain, x, y)}
                                    />
                                })
                            }
                        </div>
                    })
                }
            </div>
            <div className="board__layer board__paths">
                {
                    intersections.map((row, y) => {
                        return <div key={`intersection-row-${y}`} className="board__row">
                            {
                                row.map((intersectionData, x) => {
                                    return <Intersection
                                        key={`intersection-(${x}, ${y})`}
                                        {...intersectionData}
                                        {...props}
                                        {...intersectionProps(x, y)}
                                    />
                                })
                            }
                        </div>
                    })
                }
            </div>
        </div>
    );
}

export default Board;
export { BoardUpdate, Coordinate };