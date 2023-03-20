import { useState, useEffect } from "react";
import { CardHand, countCards } from "./card/hand";
import { defaultColors } from "./board/default";
import Deck from './card/deck';
import { PlayerData } from "../user";

interface PanelProps extends PlayerData {
    thisPlayer: boolean;
    playerTurn: boolean;
    setupTurn: boolean;
    index: number;
    dice?: string;
    canPlaceRobber: boolean;
    rollDice: () => void;
    endTurn: () => void;
};

const Panel = (props: PanelProps) => {
    const [cardCount, setCardCount] = useState<number>(0);
    const [rolled, setRolled] = useState<boolean>(false);
    const [open, setOpen] = useState<boolean>(false);

    useEffect(() => {
        setCardCount((currentCount) => {
            let count = countCards(props.cards || {});

            if (count > currentCount) {
                let panel: HTMLDivElement = document.querySelector(`#panel-${props.id}`);
                panel.style.width = "110%";

                setTimeout(() => {
                    panel.style.width = "100%";
                }, 1200);
            }

            return count;
        });
    }, [props.cards])

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

        let disabled = !props.playerTurn || props.setupTurn || rolled;

        return (
            <button disabled={disabled} onClick={rollDice}>
                <i className="fa-solid fa-dice"></i>Roll
            </button>
        );
    }

    const EndTurnButton = () => {
        function endTurn() {
            setRolled(false);
            props.endTurn();
        }

        let disabled = !props.playerTurn || props.setupTurn || props.canPlaceRobber || !rolled;

        return (
            <button disabled={disabled} onClick={endTurn}>
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
                        onClick={props.thisPlayer ? toggleHide : () => { }}
                    >
                        {cardCount}x<i className="panel__card-icon fa-solid fa-money-bill"></i>
                        {
                            props.thisPlayer && <div id={`deck-${props.id}`} className="overlay">
                                <Deck cards={props.cards} drop={true} />
                            </div>
                        }
                    </div>
                    {
                        props.thisPlayer && <div className="panel__buttons">
                            <RollDiceButton />
                            <EndTurnButton />
                        </div>
                    }
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