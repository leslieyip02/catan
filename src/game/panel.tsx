import { useState, useEffect } from "react";
import { CardHand } from "./card";
import { defaultColors } from "./board/default";

interface PanelData {
    id: string;
    index: number;
    name: string;
    cards: CardHand;
    settlements: number;
    cities: number;
    roads: number;
};

interface PanelProps extends PanelData {
    thisPlayer: boolean;
    playerTurn: boolean;
    index: number;
    rollDice: () => void;
    endTurn: () => void;
};

function Panel(props: PanelProps) {
    const [cards, setCards] = useState<CardHand>();
    const [cardCount, setCardCount] = useState<number>(0);

    useEffect(() => {
        setCards(props.cards);

        let cardCounts = Object.values(props.cards || {});
        setCardCount(cardCounts.reduce((previous, current) => previous + current, 0));
    }, [props.cards])

    return (
        <div className="panel">
            <div className="panel__info">
                <div className="panel__row">
                    <div className="panel__name">{props.name}</div>
                    {
                        props.playerTurn && <i className="fa-solid fa-gamepad" onClick={() => console.log(props.id, props.name, cards)}></i>
                    }
                </div>

                <div className="panel__row">
                    <div className="panel__cards" onClick={() => console.log(cards)}>
                        {cardCount} x <i className="panel__card-icon fa-solid fa-money-bill"></i>
                    </div>
                    <button onClick={props.rollDice}>
                        <i className="fa-solid fa-dice"></i>
                        Roll
                    </button>
                    <button onClick={props.endTurn}>
                        <i className="fa-solid fa-square-check"></i>
                        End Turn
                    </button>
                </div>
                {/* {props.thisPlayer
                    ? <div className="panel__cards"></div>
                    : <div className="panel__cards"></div>
                } */}
            </div>
            <div
                className="panel__tab"
                style={{ backgroundColor: defaultColors[props.index] }}
            >
                {
                    props.thisPlayer && <i className="fa-regular fa-user"></i>
                }
            </div>
        </div>
    );
}

export default Panel;
export { PanelData };