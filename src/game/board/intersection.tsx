import { useState, useEffect } from "react";
import Road, { RoadDirection } from "./road";

enum IntersectionType {
    fork = "fork",
    junction = "junction",
    left = "left",
    right = "right",
    end = "end",
}

interface intersectionProps {
    type: IntersectionType,
};

function Intersection(props: intersectionProps) {
    function roads() {
        switch (props.type) {
            case IntersectionType.fork:
                return (
                    <div className="road__fork">
                        <Road direction={RoadDirection.left} />
                        <Road direction={RoadDirection.right} />
                    </div>
                );

            case IntersectionType.junction:
                return <Road direction={RoadDirection.down} />;

            case IntersectionType.left:
                return <Road direction={RoadDirection.left} />;

            case IntersectionType.right:
                return <Road direction={RoadDirection.right} />;

            default:
                break;
        }
    }

    return (
        <div className={`intersection intersection--${props.type}`}>
            <div className="intersection__point"></div>
            {roads()}
        </div>
    );
};

export default Intersection;
export { IntersectionType };