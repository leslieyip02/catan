import { useState, useEffect } from "react";
import { get, set, child, DatabaseReference } from "firebase/database";
import { BoardUpdate, Coordinate } from "./";
import { Infrastructure, InfrastructureQuota } from "./infrastructure";
import { IntersectionData } from "./intersection";
import { defaultColors } from "./default";

enum RoadDirection {
    left = "left",
    right = "right",
    down = "down",
};

// properties for storage
interface RoadData {
    direction: RoadDirection;
    origin: Coordinate;
    destination: Coordinate;
    owner?: string;
    color?: string;
};

// properties for render
interface RoadProps {
    userRef: DatabaseReference;
    roomRef: DatabaseReference;
    playerTurn: boolean;
    setupTurn: boolean;
    setupQuota?: React.MutableRefObject<InfrastructureQuota>;
    direction: RoadDirection;
    origin: Coordinate;
    destination: Coordinate;
    owner?: string;
    color?: string;
    lookUp: (x: number, y: number) => IntersectionData;
    endTurn: () => void;
};

function Road(props: RoadProps) {
    const [owner, setOwner] = useState<string>();
    const [color, setColor] = useState<string>();

    // updates values when data from parent component updates
    useEffect(() => {
        setOwner(props.owner);
        setColor(props.color);
    }, [props]);

    // broadcast updates to room
    useEffect(() => {
        if (owner) {
            let boardUpdate: BoardUpdate = {
                infrastructure: Infrastructure.road,
                x: props.origin.x,
                y: props.origin.y,
                owner: owner,
                color: color,
                roadDirection: props.direction,
            };

            set(child(props.roomRef, "boardUpdate"), boardUpdate);
        }
    }, [owner]);

    function buildRoad() {
        if (props.playerTurn && !owner) {
            // roads must be connected to at least 1 road / settlement / city            
            let conenctedByIntersection = false;
            let connectedByRoad = false;
            for (let roadEnd of [props.origin, props.destination]) {
                let intersection = props.lookUp(roadEnd.x, roadEnd.y);
                if (intersection.owner && intersection.owner === props.userRef.key) {
                    conenctedByIntersection = true;
                    break;
                }

                for (let road of intersection.roads) {
                    if (road.owner === props.userRef.key) {
                        connectedByRoad = true;
                        break;
                    }
                }

                for (let { x, y } of intersection.adjacents) {
                    // check adjacent child roads to see if they lead into this intersection
                    let adjacent = props.lookUp(x, y);
                    for (let road of adjacent.roads) {
                        if (road.destination.x === roadEnd.x &&
                            road.destination.y === roadEnd.y &&
                            road.owner === props.userRef.key) {

                            connectedByRoad = true;
                            break;
                        }
                    }
                }
            }

            if (conenctedByIntersection || connectedByRoad) {
                // check for resources
                // setup infrastructure is free
                let sufficientResources = false;
                if (props.setupTurn && props.setupQuota &&
                    props.setupQuota.current[Infrastructure.road] > 0) {
                    props.setupQuota.current[Infrastructure.road]--;
                    sufficientResources = true;
                }

                if (sufficientResources) {
                    let roadsRef = child(props.userRef, "roads");
                    get(roadsRef)
                        .then((roads) => {
                            // check quota
                            let quota = roads.val();
                            if (quota > 0) {
                                set(roadsRef, quota - 1);

                                // assign ownership
                                get(child(props.userRef, "index"))
                                    .then((userIndex) => {
                                        // update owner after fetching color
                                        // so color can be sent in the board update broadcast
                                        setColor(defaultColors[userIndex.val()]);
                                        setOwner(props.userRef.key);
                                    });

                                // end turn automatically for setup turns
                                if (props.setupTurn) {
                                    props.endTurn();
                                }
                            }
                        })
                }
            }
        }
    }

    return (
        <div
            className={`road road--${props.direction}`}
            style={{ backgroundColor: color }}
            onClick={buildRoad}
        ></div>
    );
};

export default Road;
export { RoadDirection, RoadData };