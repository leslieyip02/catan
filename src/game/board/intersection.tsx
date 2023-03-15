import { useState, useEffect } from "react";
import { get, set, child, onValue, DatabaseReference } from "firebase/database";
import { BoardUpdate, Infrastructure, Coordinate } from "./";
import { Resource, ResourceRoll } from "./resource";
import Road, { RoadDirection, RoadData } from "./road";
import { defaultColors } from "./defaults";

enum IntersectionType {
    fork = "fork",
    junction = "junction",
    left = "left",
    right = "right",
    end = "end",
}

// properties for storage
interface IntersectionData {
    type: IntersectionType;
    adjacents: Coordinate[];
    roads: RoadData[];
    infrastructure: Infrastructure;
    owner?: string;
    color?: string;
};

// properties for render
interface IntersectionProps {
    userRef: DatabaseReference;
    roomRef: DatabaseReference;
    setupPhase: boolean;
    x: number;
    y: number;
    resourceRolls: ResourceRoll[];
    type: IntersectionType;
    adjacents: Coordinate[];
    roads: RoadData[];
    infrastructure: Infrastructure;
    owner?: string;
    color?: string;
    lookUp: (x: number, y: number) => IntersectionData;
};

function Intersection(props: IntersectionProps) {
    const [owner, setOwner] = useState<string>();
    const [color, setColor] = useState<string>();
    const [infrastructure, setInfrastructure] = useState<Infrastructure>();

    // updates values when data from parent component updates
    useEffect(() => {
        setOwner(props.owner);
        setColor(props.color);
        setInfrastructure(props.infrastructure);
    }, [props]);

    // broadcast updates to room
    useEffect(() => {
        if (infrastructure) {
            let boardUpdate: BoardUpdate = {
                infrastructure: infrastructure,
                x: props.x,
                y: props.y,
                owner: owner,
                color: color,
            };

            set(child(props.roomRef, "boardUpdate"), boardUpdate);
        }
    }, [infrastructure]);

    function buildSettlement() {
        if (infrastructure == Infrastructure.none) {
            // intersections must be connected to at least 1 road
            let connectedByRoad = false;
            for (let road of props.roads) {
                if (road.owner === props.userRef.key) {
                    connectedByRoad = true;
                    break;
                }
            }

            // adjacent intersections cannot have settlements / cities
            for (let { x, y } of props.adjacents) {
                let adjacent = props.lookUp(x, y);
                if (adjacent.infrastructure != Infrastructure.none) {
                    return;
                }

                // check adjacent child roads to see if they lead into this intersection
                for (let road of adjacent.roads) {
                    if (road.owner === props.userRef.key) {
                        connectedByRoad = true;
                    }
                }
            }

            if (props.setupPhase || connectedByRoad) {
                let settlementsRef = child(props.userRef, "settlements");
                get(settlementsRef)
                    .then((settlements) => {
                        // check quota
                        let quota = settlements.val();
                        if (quota > 0) {
                            set(settlementsRef, quota - 1);

                            let resourceRollsRef = child(props.userRef, "resourceRolls");
                            get(resourceRollsRef)
                                .then((currentRolls) => {
                                    let rolls: ResourceRoll[] = currentRolls.val() || [];
                                    set(resourceRollsRef, [...rolls, ...props.resourceRolls]);
                                });

                            // assign ownership
                            get(child(props.userRef, "index"))
                                .then((userIndex) => {
                                    // update only after fetching color
                                    // so color can be sent in the update broadcast
                                    setColor(defaultColors[userIndex.val()]);
                                    setOwner(props.userRef.key);
                                    setInfrastructure(Infrastructure.settlement);
                                });
                        }
                    });
            }
        }
    }

    function buildCity() {
        // does nothing once city has been built
        if (infrastructure == Infrastructure.settlement && owner == props.userRef.key) {
            let citiesRef = child(props.userRef, "cities");
            get(citiesRef)
                .then((cities) => {
                    // check quota
                    let quota = cities.val();
                    if (quota > 0) {
                        set(citiesRef, quota - 1);

                        // slot for settlement is reopened
                        let settlementsRef = child(props.userRef, "settlements");
                        get(settlementsRef)
                            .then((settlements) => set(settlementsRef, settlements.val() + 1));

                        // cities double production so just add another set of rolls
                        // probably not the most efficient data structure
                        let resourceRollsRef = child(props.userRef, "resourceRolls");
                        get(resourceRollsRef)
                            .then((currentRolls) => {
                                let rolls: ResourceRoll[] = currentRolls.val() || [];
                                set(resourceRollsRef, [...rolls, ...props.resourceRolls]);
                            });

                        setInfrastructure(Infrastructure.city);
                    }
                });
        }
    }

    return (
        <div className={`intersection intersection--${props.type}`}>
            <div
                className="intersection__point"
                style={{ backgroundColor: color }}
                onClick={() => infrastructure == Infrastructure.none ? buildSettlement() : buildCity()}
            >
                {
                    infrastructure == Infrastructure.settlement && <i className="intersection__icon fa-solid fa-oil-well"></i> ||
                    infrastructure == Infrastructure.city && <i className="intersection__icon fa-solid fa-city"></i>
                }
            </div>
            {
                props.roads.map((roadData, i) => {
                    return <Road
                        key={`road-${i}`}
                        userRef={props.userRef}
                        roomRef={props.roomRef}
                        {...roadData}
                        lookUp={props.lookUp}
                    />
                })
            }
        </div >
    );
};

export default Intersection;
export { IntersectionType, IntersectionData, IntersectionProps };