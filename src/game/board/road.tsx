import { useState, useEffect } from "react";

enum RoadDirection {
    left = "left",
    right = "right",
    down = "down",
}

interface roadProps {
    direction: RoadDirection
}

function Road(props: roadProps) {
    return (
        <div className={`road road--${props.direction}`}></div>
    );
};

export default Road;
export { RoadDirection };