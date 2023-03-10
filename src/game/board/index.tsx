import { useState, useEffect } from "react";
import { Database, DatabaseReference } from "firebase/database";
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

    return (
        <div>
            <button onClick={shuffleBoard}>Shuffle Board</button>
            <button onClick={resetBoard}>Reset Board</button>
            {
                terrains.map((row, y) => {
                    return <div key={y} className="board__row">
                        {
                            row.map((terrain, x) => {
                                return <Tile key={x} terrain={terrain} roll={rolls[y][x]} />
                            })
                        }
                    </div>
                })
            }
        </div>
    );
}

export default Board;