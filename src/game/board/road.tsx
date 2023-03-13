import { useState, useEffect } from "react";

enum RoadDirection {
    left = "left",
    right = "right",
    down = "down",
}

interface RoadProps {
    direction: RoadDirection;
}

function Road(props: RoadProps) {
    return (
        <div className={`road road--${props.direction}`}></div>
    );
};

export default Road;
export { RoadDirection };