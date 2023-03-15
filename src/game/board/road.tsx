import { useState, useEffect } from "react";
import { get, set, child, DatabaseReference } from "firebase/database";
import { BoardUpdate, Infrastructure } from "./";
import { defaultColors } from "./defaults";

enum RoadDirection {
    left = "left",
    right = "right",
    down = "down",
};

// properties for storage
interface RoadData {
    direction: RoadDirection;
    origin: { x: number, y: number };
    owner?: string;
    color?: string;
};

// properties for render
interface RoadProps {
    userRef: DatabaseReference;
    roomRef: DatabaseReference;
    direction: RoadDirection;
    origin: { x: number, y: number };
    owner?: string;
    color?: string;
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
        if (!owner) {
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
                    }
                })
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