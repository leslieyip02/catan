import Card from ".";
import { CardHand, countCards } from "./hand";
import { defaultIcons } from "./default";

interface DeckProps {
    cards: CardHand;
    drop?: boolean;
};

const Deck = (props: DeckProps) => {
    return (
        <div className={`deck${props.drop ? " deck--drop" : ""}`}>
            <div className="deck__cards">
                {
                    countCards(props.cards) > 0
                        ? Object.entries(props.cards)
                            .filter(([card, quantity]) => quantity > 0)
                            .map(([card, quantity]) => {
                                return <Card
                                    key={card}
                                    iconClassNames={defaultIcons[card]}
                                    label={`${quantity} x ${card}`}
                                />
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