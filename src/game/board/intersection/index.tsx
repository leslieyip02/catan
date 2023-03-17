import { useState, useEffect } from "react";
import { get, set, child, DatabaseReference } from "firebase/database";
import { BoardUpdate, Coordinate } from "..";
import { defaultColors } from "../default";
import Infrastructure, { InfrastructureQuota } from "../infrastructure";
import { ResourceRoll } from "../resource";
import Road, { RoadData } from "../road";

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
interface IntersectionProps extends IntersectionData {
    userRef: DatabaseReference;
    roomRef: DatabaseReference;
    playerTurn: boolean;
    setupTurn: boolean;
    setupQuota?: React.MutableRefObject<InfrastructureQuota>;
    x: number;
    y: number;
    resourceRolls: ResourceRoll[];
    lookUp: (x: number, y: number) => IntersectionData;
    endTurn: () => void;
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
        if (props.playerTurn &&
            infrastructure == Infrastructure.none) {
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

            // road connection requirement is waived for setup turns
            if (props.setupTurn || connectedByRoad) {
                // check for resources
                // setup infrastructure is free
                let sufficientResources = false;
                if (props.setupTurn && props.setupQuota &&
                    props.setupQuota.current[Infrastructure.settlement] > 0) {
                    props.setupQuota.current[Infrastructure.settlement]--;
                    sufficientResources = true;
                }

                if (sufficientResources) {
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

                                        // end turn automatically for setup turns
                                        if (props.setupTurn) {
                                            props.endTurn();
                                        }
                                    });
                            }
                        });
                }
            }
        }
    }

    function buildCity() {
        // does nothing once city has been built
        if (props.playerTurn &&
            !props.setupTurn &&
            owner == props.userRef.key &&
            infrastructure == Infrastructure.settlement) {
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
                        playerTurn={props.playerTurn}
                        setupTurn={props.setupTurn}
                        setupQuota={props.setupQuota}
                        {...roadData}
                        lookUp={props.lookUp}
                        endTurn={props.endTurn}
                    />
                })
            }
        </div >
    );
};

export default Intersection;
export { IntersectionType, IntersectionData };
export { defaultIntersections } from "./default";