import { useState, useEffect } from "react";
import { CardHand } from "./card";
import { defaultColors } from "./board/default";

interface PanelData {
    id: string;
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
                        props.playerTurn && <i className="fa-solid fa-gamepad"></i>
                    }
                </div>

                <div className="panel__cards">
                    {
                        Array(cardCount).fill(0).map(() => {
                            return <i className="panel__card-icon fa-solid fa-money-bill"></i>
                        })
                    }
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
export { PanelData as StatCardData };