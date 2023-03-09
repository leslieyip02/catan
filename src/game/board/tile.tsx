import { useState, useEffect } from "react";

interface tileProps {
    terrain: string;
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
export { tileProps };