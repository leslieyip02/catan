import { useState, useEffect } from "react";
import { get, set, child, DatabaseReference } from "firebase/database";
import { BoardUpdate, Coordinate } from "..";
import { defaultColors } from "../default";
import Infrastructure, { InfrastructureQuota, hasSufficientResources, deductResources } from "../infrastructure";
import Resource, { ResourceRoll } from "../../card/resource";
import Road, { RoadData } from "../road";
import { CardHand } from "../../card/hand";

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
    cards: React.MutableRefObject<CardHand>;
    quota: React.MutableRefObject<InfrastructureQuota>;
    x: number;
    y: number;
    resourceRolls: ResourceRoll[];
    lookUp: (x: number, y: number) => IntersectionData;
    endTurn: () => void;
};

function Intersection(props: IntersectionProps) {
    // broadcast updates to room
    function broadcastUpdate(boardUpdate: Partial<BoardUpdate>) {
        boardUpdate.x = props.x;
        boardUpdate.y = props.y;
        set(child(props.roomRef, "boardUpdate"), boardUpdate);
    }

    function buildSettlement() {
        if (props.playerTurn &&
            props.infrastructure === Infrastructure.none) {
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
                    if (road.destination.x == props.x &&
                        road.destination.y == props.y &&
                        road.owner === props.userRef.key) {
                        connectedByRoad = true;
                    }
                }
            }

            // road connection requirement is waived for setup turns
            if (props.setupTurn || connectedByRoad) {
                // setup infrastructure is free
                let sufficientQuota = false;
                if (props.quota.current[Infrastructure.settlement] > 0) {
                    props.quota.current[Infrastructure.settlement]--;
                    sufficientQuota = true;
                }

                // check for resources
                let sufficientResources = hasSufficientResources(Infrastructure.road, props.cards);
                if (sufficientQuota || sufficientResources) {
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
                                        broadcastUpdate({
                                            infrastructure: Infrastructure.settlement,
                                            owner: props.userRef.key,
                                            color: defaultColors[userIndex.val()],
                                        });
                                    });

                                // deduct cost
                                if (!sufficientQuota && sufficientResources) {
                                    deductResources(Infrastructure.settlement, props.userRef);
                                }

                                // end turn automatically for setup turns
                                if (props.setupTurn) {
                                    props.endTurn();
                                }
                            }
                        });
                }
            }
        }
    }

    function buildCity() {
        // does nothing once city has been built
        if (props.playerTurn && !props.setupTurn &&
            props.infrastructure === Infrastructure.settlement &&
            props.owner === props.userRef.key) {

            let sufficientResources = hasSufficientResources(Infrastructure.city, props.cards);
            if (sufficientResources) {
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

                            // deduct cost
                            deductResources(Infrastructure.city, props.userRef);

                            broadcastUpdate({
                                infrastructure: Infrastructure.city,
                                owner: props.owner,
                                color: props.color,
                            });
                        }
                    });
            }
        }
    }

    // map attributes so that intersections can easily be selected
    function dataAttributes() {
        if (props.owner) {
            let data: { [key: string]: boolean } = {};
            for (let roll of props.resourceRolls) {
                let attribute = `data-roll-${Object.keys(roll)[0]}`;
                data[attribute] = true;
            }

            return data;
        }
    }

    return (
        <div className={`intersection intersection--${props.type}`}>
            <div
                className="intersection__point"
                style={{ backgroundColor: props.color }}
                {...dataAttributes()}
                onClick={() => props.infrastructure == Infrastructure.none ? buildSettlement() : buildCity()}
            >
                {
                    props.infrastructure === Infrastructure.settlement && <i className="intersection__icon fa-solid fa-oil-well"></i> ||
                    props.infrastructure === Infrastructure.city && <i className="intersection__icon fa-solid fa-city"></i>
                }
            </div>
            {
                props.roads.map((roadData, i) => {
                    return <Road
                        key={`road-${i}`}
                        {...roadData}
                        userRef={props.userRef}
                        roomRef={props.roomRef}
                        playerTurn={props.playerTurn}
                        setupTurn={props.setupTurn}
                        cards={props.cards}
                        quota={props.quota}
                        lookUp={props.lookUp}
                        endTurn={props.endTurn}
                        broadcastUpdate={broadcastUpdate}
                    />
                })
            }
        </div >
    );
};

export default Intersection;
export { IntersectionType, IntersectionData };
export { defaultIntersections } from "./default";