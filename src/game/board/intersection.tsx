import { useState, useEffect } from "react";
import { get, set, child, onValue, DatabaseReference } from "firebase/database";
import { BoardUpdate } from "./";
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
    x: number;
    y: number;
    userRef: DatabaseReference;
    roomRef: DatabaseReference;
    type: IntersectionType;
    resourceRolls: ResourceRoll[];
    owner?: string;
    color?: string;
};

function Intersection(props: IntersectionProps) {
    const [owner, setOwner] = useState<string>(props.owner);
    const [color, setColor] = useState<string>(props.color);
    const [productionTier, setProductionTier] = useState<number>(0);

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

    // TODO: move this listener up into board instead so there's only one listener instead of 54
    // listen to room updates
    useEffect(() => {
        onValue(child(props.roomRef, "boardUpdate"), (update) => {
            let updateProps: BoardUpdate = update.val();
            if (updateProps && updateProps.owner != owner &&
                (updateProps.type == "settlement" || updateProps.type == "city") &&
                updateProps.x == props.x && updateProps.y == props.y) {

                setOwner(updateProps.owner);
                setColor(updateProps.color);
                setProductionTier(updateProps.type == "settlement" ? 1 : 2);
            }
        });
    }, []);

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
                        get(child(props.userRef, "color"))
                            .then((userColor) => {
                                // update production tier after fetching color
                                // so color can be sent in the board update broadcast
                                setColor(userColor.val());
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
                {
                    intersectionIcon()
                }
            </div>
            {
                intersectionRoads()
            }
        </div >
    );
};

export default Intersection;
export { IntersectionType };