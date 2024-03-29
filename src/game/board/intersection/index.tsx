import { get, set, child, DatabaseReference, increment, update } from 'firebase/database';
import { BoardUpdate, Coordinate } from "..";
import { defaultColors } from "../default";
import Infrastructure, { InfrastructureQuota, hasSufficientResources, deductResources } from "../infrastructure";
import { ResourceRoll } from "../../card/resource";
import Road, { RoadData } from "../road";
import { CardHand } from "../../card/hand";
import Harbor, { HarborData } from '../harbor';
import { useRef } from 'react';

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
    harbor?: HarborData;
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
    rolled: boolean;
    canPlaceRobber: boolean;
    needToSteal: boolean;
    allDiscarded: boolean;
    ongoingTrade: boolean;
    lookUp: (x: number, y: number) => IntersectionData;
    endTurn: () => void;
};

const Intersection = (props: IntersectionProps) => {
    // broadcast updates to room
    function broadcastUpdate(boardUpdate: Partial<BoardUpdate>) {
        boardUpdate.x = props.x;
        boardUpdate.y = props.y;
        set(child(props.roomRef, "boardUpdate"), boardUpdate);
    }

    function buildSettlement() {
        if (props.playerTurn &&
            (props.rolled || props.setupTurn) &&
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
                                    // starter resources given by 2nd settlement
                                    if (props.quota.current[Infrastructure.settlement] === 0) {
                                        for (let resourceRoll of props.resourceRolls) {
                                            let roll = Number(Object.keys(resourceRoll)
                                                .filter((key) => key !== "tile")[0]);
                                            update(child(props.userRef, "cards"), { [resourceRoll[roll]]: increment(1) });
                                        }
                                    }

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
        if (props.playerTurn && props.rolled &&
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

    function roadProps() {
        return {
            userRef: props.userRef,
            roomRef: props.roomRef,
            playerTurn: props.playerTurn,
            setupTurn: props.setupTurn,
            cards: props.cards,
            quota: props.quota,
            rolled: props.rolled,
            lookUp: props.lookUp,
            endTurn: props.endTurn,
            broadcastUpdate: broadcastUpdate,
        };
    }

    function harborProps() {
        return {
            ...props.harbor,
            userRef: props.userRef,
            playerTurn: props.playerTurn,
            setupTurn: props.setupTurn,
            cards: props.cards,
            rolled: props.rolled,
            canPlaceRobber: props.canPlaceRobber,
            needToSteal: props.needToSteal,
            allDiscarded: props.allDiscarded,
            ongoingTrade: props.ongoingTrade,
            lookUp: props.lookUp,
        };
    }

    const IntersectionIcon = () => {
        if (props.infrastructure === Infrastructure.settlement) {
            return <i className="intersection__icon fa-solid fa-oil-well"></i>;
        } else if (props.infrastructure === Infrastructure.city) {
            return <i className="intersection__icon fa-solid fa-city"></i>;
        }
    }

    return (
        <div className={`intersection intersection--${props.type}`}>
            <div
                id={`intersection-point-(${props.x}, ${props.y})`}
                className="intersection__point"
                style={{ backgroundColor: props.color }}
                onClick={() => {
                    props.infrastructure === Infrastructure.none
                        ? buildSettlement()
                        : buildCity();
                }}
                {...dataAttributes()}
            >
                <IntersectionIcon />
            </div>
            {
                props.roads.map((roadData, i) => {
                    return <Road
                        key={`road-${i}`}
                        {...roadData}
                        {...roadProps()}
                    />
                })
            }
            {
                props.harbor && <Harbor {...harborProps()} />
            }
        </div>
    );
};

export default Intersection;
export { IntersectionType, IntersectionData };
export { defaultIntersections } from "./default";