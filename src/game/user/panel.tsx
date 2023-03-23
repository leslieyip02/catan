import { useState, useEffect, useRef, FormEvent } from "react";
import { CardHand, countCards, differentCards } from "../card/hand";
import { defaultColors } from "../board/default";
import Deck from '../card/deck';
import { PlayerData } from ".";
import TradeForm from "../trade/form";
import Inventory from './inventory';
import Resource from "../card/resource";

interface PanelProps extends PlayerData {
    thisPlayer: boolean;
    playerTurn: boolean;
    setupTurn: boolean;
    index: number;
    dice?: string;
    canPlaceRobber: boolean;
    needToSteal: boolean;
    allDiscarded: boolean;
    ongoingTrade: boolean;
    rollDice: () => void;
    stealCards: (targetId: string, cards: CardHand) => void;
    offerTrade: (targetId: string, offering: CardHand,
        requesting: CardHand) => Promise<string>;
    endTurn: () => void;
};

const UserPanel = (props: PanelProps) => {
    const [cardCount, setCardCount] = useState<number>(0);
    const [rolled, setRolled] = useState<boolean>(false);

    // keep track of whether cards have changed
    const cards = useRef<CardHand>({});

    useEffect(() => {
        // check for card changes
        if (differentCards(cards.current, props.cards)) {
            cards.current = { ...props.cards };
            activatePanel();
        }

        setCardCount(countCards(props.cards || {}));
    }, [props.cards])

    function activatePanel() {
        let panel: HTMLDivElement = document.querySelector(`#panel-${props.id}`);
        panel.style.width = "110%";

        setTimeout(() => {
            panel.style.width = "100%";
        }, 1200);
    }

    const RollDiceButton = () => {
        function rollDice() {
            setRolled(true);
            props.rollDice();
        }

        let canRoll = props.playerTurn && !props.setupTurn && !rolled;

        return (
            <button disabled={!canRoll} onClick={rollDice}>
                <i className="fa-solid fa-dice"></i>Roll
            </button>
        );
    }

    const StealButton = () => {
        const [hidden, setHidden] = useState<boolean>(true);

        function toggleHide() {
            let stealMenu: HTMLDivElement = document.querySelector(`#steal-menu-${props.id}`);
            stealMenu.style.display = "flex";
        }

        function stealCard(cards: CardHand) {
            setHidden(false);

            setTimeout(() => {
                props.stealCards(props.id, cards);
            }, 2000);
        }

        return (
            <div onClick={toggleHide}>
                <i className="fa-solid fa-people-robbery"></i>
                <div
                    id={`steal-menu-${props.id}`}
                    className="overlay"
                    style={{ display: "none" }}
                >
                    <Deck
                        cards={props.cards}
                        drop={true}
                        hidden={hidden}
                        selectQuota={1}
                        actionLabel={"Steal 1"}
                        action={stealCard}
                    />
                </div>
            </div>
        );
    }

    const EndTurnButton = () => {
        function endTurn() {
            setRolled(false);
            props.endTurn();
        }

        let canEnd = props.playerTurn && !props.setupTurn &&
            !props.canPlaceRobber && !props.ongoingTrade &&
            !props.needToSteal && props.allDiscarded && rolled;

        return (
            <button disabled={!canEnd} onClick={endTurn}>
                <i className="fa-solid fa-square-check"></i>End Turn
            </button>
        );
    }

    return (
        <div id={`panel-${props.id}`} className="panel">
            <div className="panel__info">
                <div className="panel__row">
                    <div className="panel__name">{props.name}</div>
                    {
                        props.playerTurn && <i className="fa-solid fa-gamepad"></i>
                    }
                </div>
                <div className="panel__row">
                    <Inventory {...props} cardCount={cardCount} />
                    <div className="panel__buttons">
                        {
                            props.thisPlayer
                                ? <>
                                    <RollDiceButton />
                                    <EndTurnButton />
                                </>
                                : <TradeForm {...props} />
                        }
                        {
                            props.canStealFrom && props.needToSteal && <StealButton />
                        }
                    </div>
                </div>
            </div>
            <div
                className="panel__tab"
                style={{ backgroundColor: defaultColors[props.index] }}
            >
                {
                    props.thisPlayer && <i className="fa-regular fa-user"></i>
                }
                <span
                    className="panel__dice"
                    style={{ opacity: (props.playerTurn && props.dice) ? "100%" : "0%" }}
                >
                    <div className="panel__dice-text">{props.dice}</div>
                </span>
            </div>
        </div>
    );
}

export default UserPanel;
export { PanelProps };