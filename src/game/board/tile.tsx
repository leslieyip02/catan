import { useState, useEffect } from "react";

enum TerrainType {
    hills = "hills",
    forest = "forest",
    mountains = "mountains",
    fields = "fields",
    pasture = "pasture",
    desert = "desert",
};

interface tileProps {
    terrain: TerrainType;
    roll: number;
};

function Tile(props: tileProps) {
    return (
        <div className="tile" data-terrain={props.terrain}>
            <div className="tile__text">{props.roll}</div>
        </div>
    );
};

export default Tile;
export { TerrainType, tileProps };