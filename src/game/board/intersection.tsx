import { useState, useEffect } from "react";
import { Resource, ResourceRoll } from "./resource";
import Road, { RoadDirection } from "./road";

enum IntersectionType {
    fork = "fork",
    junction = "junction",
    left = "left",
    right = "right",
    end = "end",
}

interface IntersectionProps {
    type: IntersectionType;
    resourceRolls: ResourceRoll[];
};

function Intersection(props: IntersectionProps) {
    function roads() {
        switch (props.type) {
            case IntersectionType.fork:
                return (
                    <div>
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

    // TODO: build settlement method

    return (
        <div className={`intersection intersection--${props.type}`}>
            <div className="intersection__point" onClick={() => console.log(props.resourceRolls)}></div>
            {roads()}
        </div>
    );
};

export default Intersection;
export { IntersectionType };