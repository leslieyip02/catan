import { DatabaseReference } from 'firebase/database';
import { Coordinate } from '.';
import Resource from '../card/resource';
import { defaultIcons } from '../card/default';
import { exchangeResources } from '../trade/maritime';
import { CardHand } from '../card/hand';
import { useState, useEffect } from 'react';
import { IntersectionData } from './intersection';

enum HarborDirection {
    above = "above",
    below = "below",
    left = "left",
    right = "right",
};

interface HarborData {
    direction?: HarborDirection;
    access?: Coordinate[];
    resource: Resource;
};

interface HarborProps extends HarborData {
    userRef: DatabaseReference;
    playerTurn: boolean;
    setupTurn: boolean;
    cards: React.MutableRefObject<CardHand>;
    rolled: boolean;
    canPlaceRobber: boolean;
    needToSteal: boolean;
    allDiscarded: boolean;
    ongoingTrade: boolean;
    lookUp?: (x: number, y: number) => IntersectionData;
};

interface ResourceDropDownProps {
    resource?: Resource;
    setResource: React.Dispatch<React.SetStateAction<Resource>>;
};

const Harbor = (props: HarborProps) => {
    const [offering, setOffering] = useState<Resource>(props.resource);
    const [requesting, setRequesting] = useState<Resource>(Resource.none);

    const panel = !!!props.direction;
    const ratio = panel ? 4 : (props.resource !== Resource.none ? 2 : 3);

    function setLeftOffset() {
        switch (props.direction) {
            case HarborDirection.above: {
                let [upper, lower] = props.access;

                return {
                    left: upper.x >= lower.x
                        ? "calc(var(--tile-width) * -0.5)"
                        : "calc(var(--tile-width) * 0.5)",
                }
            }

            case HarborDirection.below: {
                let [lower, upper] = props.access;
                let left = lower.x >= upper.x
                    ? "calc(var(--tile-width) * -0.5)"
                    : "calc(var(--tile-width) * 0.5)";

                return {
                    left: left,
                }
            }

            default:
                return {};
        };
    }

    function activateParentIntersections() {
        for (let { x, y } of props.access) {
            let intersection = document.getElementById(`intersection-point-(${x}, ${y})`);
            intersection.classList.add("intersection__point--hovered");
        }
    }

    function deactivateParentIntersections() {
        for (let { x, y } of props.access) {
            let intersection = document.getElementById(`intersection-point-(${x}, ${y})`);
            intersection.classList.remove("intersection__point--hovered");
        }
    }

    const ResourceDropDown = (props: ResourceDropDownProps) => {
        function selectResource(resource: Resource) {
            props.setResource(resource);
        }

        return (
            <div className="harbor__drop-down">
                {
                    props.resource === Resource.none
                        ? <i className={`habor__icons ${defaultIcons["unknown"].join(" ")}`}></i>
                        : <i className={`habor__icons ${defaultIcons[props.resource].join(" ")}`}></i>
                }
                <div className="harbor__options">
                    {
                        Object.values(Resource)
                            .filter((resource) => resource !== Resource.none)
                            .map((resource) => {
                                return <div
                                    key={`harbor-options-${props.setResource}-${resource}`}
                                    className="harbor__option"
                                    onClick={() => selectResource(resource)}
                                >
                                    <i className={`habor__icons ${defaultIcons[resource].join(" ")}`}></i>
                                </div>
                            })
                    }
                </div>
            </div>
        );
    }

    const HarborContent = () => {
        function processTrade(e: React.FormEvent) {
            e.preventDefault();

            if (requesting !== Resource.none &&
                props.cards.current[offering] >= ratio) {
                exchangeResources(props.userRef, offering, requesting, ratio);
            }
        }

        let canTrade = props.playerTurn && props.rolled &&
            props.cards.current[offering] >= ratio &&
            !props.setupTurn && !props.canPlaceRobber &&
            !props.needToSteal && !props.ongoingTrade;

        return (
            <form className="harbor__form">
                {
                    props.resource === Resource.none
                        ? <ResourceDropDown
                            resource={offering}
                            setResource={setOffering}
                        />
                        : <i className={`habor__icons ${defaultIcons[props.resource].join(" ")}`}></i>
                }
                <span>:</span>
                <ResourceDropDown
                    resource={requesting}
                    setResource={setRequesting}
                />
                <div
                    className="harbor__confirm"
                    onClick={(e) => canTrade ? processTrade(e) : {}}
                >
                    <i className="fa-solid fa-square-check">
                        <span className="tooltip">{`${ratio}:1 Trade`}</span>
                    </i>
                </div>
            </form>
        );
    }

    return (
        <div
            className={`harbor harbor--${props.direction}${panel ? " harbor--panel" : ""}`}
            style={setLeftOffset()}
            onMouseEnter={activateParentIntersections}
            onMouseLeave={deactivateParentIntersections}
        >
            <i className="fa-solid fa-ship"></i>
            {
                panel && !props.playerTurn
                    ? <span className="tooltip">4:1 Trade</span>
                    : <span className="tooltip tooltip--big">
                        <HarborContent />
                    </span>
            }
        </div>
    );
}

export default Harbor;
export { HarborDirection, HarborData };