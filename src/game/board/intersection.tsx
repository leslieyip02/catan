import { useState, useEffect } from "react";
import { get, set, child, push, DatabaseReference } from 'firebase/database';
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
    userRef: DatabaseReference;
    type: IntersectionType;
    resourceRolls: ResourceRoll[];
    owner?: string;
    color?: string;
};

function Intersection(props: IntersectionProps) {
    const [userRef, setUserRef] = useState<DatabaseReference>(props.userRef);
    const [owner, setOwner] = useState<string>();
    const [color, setColor] = useState<string>();
    const [productionTier, setProductionTier] = useState<number>(0);

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
            let settlementsRef = child(userRef, "settlements");
            // get(child(targetRoomRef, "users"))
            //                 .then((currentUsers) => {
            //                     let currentUserIds: string[] = currentUsers.val() || [];
            //                     set(child(targetRoomRef, "users"), [...currentUserIds, userId]);
            get(settlementsRef)
                .then((currentSettlements) => {
                    // check user's quota for settlements
                    if (currentSettlements.val() > 0) {
                        set(settlementsRef, currentSettlements.val() - 1);

                        let resourceRollsRef = child(userRef, "resourceRolls");
                        get(resourceRollsRef)
                            .then((currentRolls) => {
                                let rolls: ResourceRoll[] = currentRolls.val() || [];
                                set(resourceRollsRef, [...rolls, ...props.resourceRolls]);
                            });

                        // assign ownership
                        setOwner(userRef.key);
                        get(child(userRef, "color"))
                            .then((userColor) => setColor(userColor.val()));
                        setProductionTier((currentProductionTier) => currentProductionTier + 1);
                    }
                });
        }
    }

    function buildCity() {
        // does nothing once city has been built
        if (productionTier == 1) {
            let citiesRef = child(userRef, "cities");
            get(citiesRef)
                .then((currentCities) => {
                    if (currentCities.val() > 0) {
                        set(citiesRef, currentCities.val() - 1);

                        let settlementsRef = child(userRef, "settlements");
                        get(settlementsRef)
                            .then((currentSettlements) => set(settlementsRef, currentSettlements.val() + 1));

                        // cities double production so just add another set of rolls
                        let resourceRollsRef = child(userRef, "resourceRolls");
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

    // TODO: build settlement method

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