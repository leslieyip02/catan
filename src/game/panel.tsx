import { useState, useEffect, useRef, FormEvent } from "react";
import { CardHand, countCards, differentCards } from "./card/hand";
import { defaultColors } from "./board/default";
import Deck from './card/deck';
import { PlayerData } from "../user";
import TradeForm from "./trade/form";
import { CardType } from "./card";

interface PanelProps extends PlayerData {
    thisPlayer: boolean;
    playerTurn: boolean;
    setupTurn: boolean;
    index: number;
    dice?: string;
    canPlaceRobber: boolean;
    ongoingTrade: boolean;
    ongoingSteal: boolean;
    rollDice: () => void;
    offerTrade: (targetId: string, offering: CardHand,
        requesting: CardHand) => Promise<string>;
    endTurn: () => void;
};

const Panel = (props: PanelProps) => {
    const [cardCount, setCardCount] = useState<number>(0);
    const [rolled, setRolled] = useState<boolean>(false);
    const [open, setOpen] = useState<boolean>(false);

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

    function toggleHide() {
        let deck: HTMLDivElement = document.querySelector(`#deck-${props.id}`);
        deck.style.display = open ? "none" : "block";
        setOpen(!open);
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
        return (
            <button>
                <i className="fa-solid fa-people-robbery"></i>
            </button>
        );
    }

    const EndTurnButton = () => {
        function endTurn() {
            setRolled(false);
            props.endTurn();
        }

        let canEnd = props.playerTurn && !props.setupTurn &&
            !props.canPlaceRobber && !props.ongoingTrade &&
            !props.ongoingSteal && rolled;

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
                    <div
                        className="panel__cards"
                        onClick={() => props.thisPlayer ? toggleHide() : {}}
                    >
                        {cardCount}x<i className="panel__card-icon fa-solid fa-money-bill"></i>
                        {
                            props.thisPlayer && <div id={`deck-${props.id}`} className="overlay">
                                <Deck cards={props.cards} drop={true} />
                            </div>
                        }
                    </div>
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
                            props.canStealFrom && <StealButton />
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

export default Panel;
export { PanelProps };