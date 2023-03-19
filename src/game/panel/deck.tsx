import { CardHand, countCards } from "../card";
import Resource from "../board/resource";

interface DeckProps {
    cards: CardHand;
};

function Deck(props: DeckProps) {
    function cardIcon(card: string) {
        let classNames = ["deck__card-icon", "fa-solid"];

        let icons: Record<string, string> = {
            [Resource.brick]: "fa-trowel-bricks",
            [Resource.grain]: "fa-wheat-awn",
            [Resource.lumber]: "fa-tree",
            [Resource.ore]: "fa-mountain",
            [Resource.wool]: "fa-worm",
        };

        classNames.push(icons[card] || "")
        return <i className={classNames.join(" ")}></i>
    }

    return (
        <div className="deck">
            <div className="deck__content">
                <div className="deck__cards">
                    {
                        countCards(props.cards) > 0
                            ? Object.entries(props.cards)
                                .filter(([card, quantity]) => quantity > 0)
                                .map(([card, quantity]) => {
                                    return <div
                                        className="deck__card"
                                        key={card}
                                    >
                                        {
                                            cardIcon(card)
                                        }
                                        <div className="deck__card-label">
                                            {`${quantity} x ${card}`}
                                        </div>
                                    </div>
                                })
                            : <div
                                className="deck__card"
                            >
                                <i className="deck__card-icon fa-solid fa-face-frown"></i>
                                <div className="deck__card-label">
                                    No cards
                                </div>
                            </div>
                    }
                </div>
            </div>
        </div>
    );
}

export default Deck;