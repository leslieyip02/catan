import { useState } from "react";
import Card from ".";
import { CardHand, countCards } from "./hand";
import { defaultIcons } from "./default";

interface DeckProps {
    cards: CardHand;
    drop?: boolean;
    stack?: boolean;
};

const Deck = (props: DeckProps) => {
    const [stack, setStack] = useState<boolean>(props.stack || false);

    return (
        <div className={`deck${props.drop ? " deck--drop" : ""}`}>
            {
                countCards(props.cards) > 0 && <button
                    className="deck__stack"
                    onClick={(e) => {
                        e.stopPropagation();
                        setStack((current) => !current);
                    }}>
                    <i className="fa-solid fa-layer-group"></i>
                </button>
            }
            <div className="deck__cards">
                {
                    countCards(props.cards) > 0
                        ? Object.entries(props.cards)
                            .filter(([card, quantity]) => quantity > 0)
                            .map(([card, quantity]) => {
                                return stack
                                    ? <Card
                                        key={`stacked-${card}`}
                                        iconClassNames={defaultIcons[card]}
                                        label={`${quantity} x ${card}`}
                                    />
                                    : <>
                                        {
                                            Array(quantity).fill(0)
                                                .map((_, i) => {
                                                    return <Card
                                                        key={`${card}-${i}`}
                                                        iconClassNames={defaultIcons[card]}
                                                        label={card}
                                                    />
                                                })
                                        }
                                    </>
                            })
                        : <Card
                            iconClassNames={["fa-solid", "fa-face-frown"]}
                            label={"No cards"}
                        />
                }
            </div>
        </div>
    );
}

export default Deck;