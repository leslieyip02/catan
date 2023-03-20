import { useState, useEffect } from "react";
import { get, set, child, DatabaseReference } from "firebase/database";
import { BoardUpdate, Coordinate } from "./";
import Infrastructure, { InfrastructureQuota, hasSufficientResources, deductResources } from "./infrastructure";
import { IntersectionData } from "./intersection";
import { defaultColors } from "./default";
import { CardHand } from "../card/hand";

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
interface RoadProps extends RoadData {
    userRef: DatabaseReference;
    roomRef: DatabaseReference;
    playerTurn: boolean;
    setupTurn: boolean;
    cards: React.MutableRefObject<CardHand>;
    quota: React.MutableRefObject<InfrastructureQuota>;
    lookUp: (x: number, y: number) => IntersectionData;
    broadcastUpdate: (boardUpdate: Partial<BoardUpdate>) => void;
    endTurn: () => void;
};

const Road = (props: RoadProps) => {
    function buildRoad() {
        if (props.playerTurn && !props.owner) {
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
                let sufficientQuota = false;
                if (props.quota.current[Infrastructure.road] > 0) {
                    props.quota.current[Infrastructure.road]--;
                    sufficientQuota = true;
                }

                let sufficientResources = hasSufficientResources(Infrastructure.road, props.cards);
                if (sufficientQuota || sufficientResources) {
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
                                        props.broadcastUpdate({
                                            infrastructure: Infrastructure.road,
                                            owner: props.userRef.key,
                                            color: defaultColors[userIndex.val()],
                                            roadDirection: props.direction,
                                        });
                                    });

                                // deduct cost
                                if (!sufficientQuota && sufficientResources) {
                                    deductResources(Infrastructure.road, props.userRef);
                                }

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
            style={{ backgroundColor: props.color }}
            onClick={buildRoad}
        ></div>
    );
};

export default Road;
export { RoadDirection, RoadData };