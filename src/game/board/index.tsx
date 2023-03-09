import { useState, useEffect } from "react";
import { Database, DatabaseReference } from "firebase/database";
import Tile, { tileProps } from "./tile";

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

    return (
        <div>
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