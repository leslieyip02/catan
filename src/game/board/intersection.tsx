import { useState, useEffect } from "react";
import { get, set, child, onValue, DatabaseReference, increment } from "firebase/database";
import { BoardUpdate } from "./";
import { defaultColors } from "./defaults";
import { Resource, ResourceRoll } from "./resource";
import Road, { RoadDirection } from "./road";

enum IntersectionType {
    fork = "fork",
    junction = "junction",
    left = "left",
    right = "right",
    end = "end",
}

// these are the properties that are stored in the Board
interface IntersectionData {
    type: IntersectionType;
    owner?: string;
    color?: string;
    productionTier?: number;
};

// these are the properties that are needed for render
interface IntersectionProps {
    x: number;
    y: number;
    userRef: DatabaseReference;
    roomRef: DatabaseReference;
    type: IntersectionType;
    resourceRolls: ResourceRoll[];
    owner?: string;
    color?: string;
    productionTier?: number;
};

function Intersection(props: IntersectionProps) {
    const [owner, setOwner] = useState<string>(props.owner);
    const [color, setColor] = useState<string>(props.color);
    const [productionTier, setProductionTier] = useState<number>(props.productionTier || 0);

    // updates values when data from parent component updates
    useEffect(() => {
        setOwner(props.owner);
        setColor(props.color);
        setProductionTier(props.productionTier || 0);
    }, [props]);

    // broadcast updates to room
    useEffect(() => {
        if (productionTier != 0) {
            let boardUpdate: BoardUpdate = {
                x: props.x,
                y: props.y,
                type: productionTier == 1 ? "settlement" : "city",
                owner: owner,
                color: color,
            };

            set(child(props.roomRef, "boardUpdate"), boardUpdate);
        }
    }, [productionTier]);

    function intersectionRoads(): JSX.Element {
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

    function intersectionIcon(): JSX.Element {
        switch (productionTier) {
            case 1:
                return <i className="intersection__icon fa-solid fa-oil-well"></i>;

            case 2:
                return <i className="intersection__icon fa-solid fa-city"></i>;

            default:
                break;
        }
    }

    function buildSettlement() {
        if (productionTier == 0) {
            let settlementsRef = child(props.userRef, "settlements");
            get(settlementsRef)
                .then((currentSettlements) => {
                    // check user's quota for settlements
                    if (currentSettlements.val() > 0) {
                        set(settlementsRef, currentSettlements.val() - 1);

                        let resourceRollsRef = child(props.userRef, "resourceRolls");
                        get(resourceRollsRef)
                            .then((currentRolls) => {
                                let rolls: ResourceRoll[] = currentRolls.val() || [];
                                set(resourceRollsRef, [...rolls, ...props.resourceRolls]);
                            });

                        // assign ownership
                        setOwner(props.userRef.key);
                        get(child(props.userRef, "index"))
                            .then((userIndex) => {
                                // update production tier after fetching color
                                // so color can be sent in the board update broadcast
                                setColor(defaultColors[userIndex.val()]);
                                setProductionTier((currentProductionTier) => currentProductionTier + 1);
                            });
                    }
                });
        }
    }

    function buildCity() {
        // does nothing once city has been built
        if (productionTier == 1 && owner == props.userRef.key) {
            let citiesRef = child(props.userRef, "cities");
            get(citiesRef)
                .then((currentCities) => {
                    if (currentCities.val() > 0) {
                        set(citiesRef, currentCities.val() - 1);

                        let settlementsRef = child(props.userRef, "settlements");
                        get(settlementsRef)
                            .then((currentSettlements) => set(settlementsRef, currentSettlements.val() + 1));

                        // cities double production so just add another set of rolls
                        let resourceRollsRef = child(props.userRef, "resourceRolls");
                        get(resourceRollsRef)
                            .then((currentRolls) => {
                                let rolls: ResourceRoll[] = currentRolls.val() || [];
                                set(resourceRollsRef, [...rolls, ...props.resourceRolls]);
                            });

                        setProductionTier((currentProductionTier) => currentProductionTier + 1);
                    }
                });
        }
    }

    return (
        <div className={`intersection intersection--${props.type}`}>
            <div
                className="intersection__point"
                style={{ backgroundColor: color }}
                onClick={() => productionTier == 0 ? buildSettlement() : buildCity()}
            >
                {intersectionIcon()}
            </div>
            {intersectionRoads()}
        </div >
    );
};

export default Intersection;
export { IntersectionType, IntersectionData, IntersectionProps };