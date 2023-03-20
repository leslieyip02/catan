import { useState, useEffect, useRef } from "react";
import { CardHand, countCards } from "../card/hand";
import Resource from "../card/resource";
import { defaultIcons } from "../card/default";

interface TradeFormProps {
    thisPlayer: boolean;
    playerTurn: boolean;
    setupTurn: boolean;
    id: string;
    index: number;
    dice?: string;
    canPlaceRobber: boolean;
    trading: boolean;
    offerTrade: (targetId: string, offering: CardHand,
        requesting: CardHand) => Promise<string>;
};

const TradeForm = (props: TradeFormProps) => {
    const [tooltipText, setTooltipText] = useState<string>();

    const offering = useRef<CardHand>({});
    const requesting = useRef<CardHand>({});

    useEffect(() => {
        if (tooltipText) {
            let formTooltip: HTMLSpanElement = document
                .querySelector(`#form-tooltip-${props.id}`);
            formTooltip.style.visibility = "visible";

            setTimeout(() => {
                formTooltip.style.visibility = "hidden";
            }, 2000);
        }
    }, [tooltipText]);

    function offerTrade(e: React.FormEvent) {
        // prevent page reload
        e.preventDefault();

        // check if the form is filled
        if (countCards(offering.current) + countCards(requesting.current) > 0) {
            setTooltipText(null);
            
            // send trade offer
            props.offerTrade(props.id, offering.current, requesting.current)
            .then((sent) => setTooltipText(sent))
            .catch((rejected) => setTooltipText(rejected));
            
            // reset inputs
            document.querySelectorAll(".trade__input")
            .forEach((input: HTMLInputElement) => input.value = null);
            offering.current = {};
            requesting.current = {};
        }
    }

    function canTrade(): boolean {
        // dice is null if not rolled
        return props.dice && !props.playerTurn &&
            !props.setupTurn && !props.canPlaceRobber && !props.trading;
    }

    const TradeInput = ({ offer, resource }: { offer: boolean, resource: Resource }) => {
        function updateTrade(quantity: string) {
            if (offer) {
                offering.current[resource] = Number(quantity) || 0;
            } else {
                requesting.current[resource] = Number(quantity) || 0;
            }
        }

        return (
            <input
                className="trade__input"
                type="number"
                min="0"
                onChange={(e) => updateTrade(e.target.value)}
            />
        );
    }

    const TradeMatrix = () => {
        return (
            <table className="trade__table">
                <thead>
                    <tr>
                        <th></th>
                        <th>for</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {
                        Object.keys(Resource)
                            .map((resource: Resource) => {
                                if (resource != Resource.none) {
                                    let iconClassNames = defaultIcons[resource].join(" ");

                                    return <tr key={`trade-row-${resource}`}>
                                        <td>
                                            <TradeInput offer={true} resource={resource} />
                                        </td>
                                        <td className="trade__icon">
                                            <i className={iconClassNames}></i>
                                        </td>
                                        <td>
                                            <TradeInput offer={false} resource={resource} />
                                        </td>
                                    </tr>
                                }
                            })
                    }
                </tbody>
            </table>
        );
    }

    return (
        <form
            className="form trade__form"
            style={{ pointerEvents: canTrade() ? "all" : "none" }}
            onSubmit={offerTrade}
        >
            <span
                id={`form-tooltip-${props.id}`}
                className="tooltip"
                style={{ visibility: "hidden" }}
            >
                {tooltipText}
            </span>
            <button className="trade__button" disabled={!canTrade()} type="submit">
                <i className="fa-solid fa-arrow-right-arrow-left"></i>Trade
            </button>

            <TradeMatrix />
        </form>
    );
}

export default TradeForm;