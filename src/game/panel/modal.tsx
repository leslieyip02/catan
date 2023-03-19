import { CardHand, countCards } from "../card";
import Resource from "../board/resource";

interface ModalProps {
    cards: CardHand;
    toggleHide: () => void;
};

function Modal(props: ModalProps) {
    function cardIcon(card: string) {
        let classNames = ["modal__card-icon", "fa-solid"];

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
        <div className="modal">
            <div className="modal__content">
                <div className="modal__cards">
                    {
                        countCards(props.cards) > 0
                            ? Object.entries(props.cards).map(([card, quantity]) => {
                                return <div
                                    className="modal__card"
                                    key={card}
                                >
                                    {
                                        cardIcon(card)
                                    }
                                    <div className="modal__card-label">
                                        {`${quantity} x ${card}`}
                                    </div>
                                </div>
                            })
                            : <div
                                className="modal__card"
                            >
                                <i className="modal__card-icon fa-solid fa-face-frown"></i>
                                <div className="modal__card-label">
                                    No cards
                                </div>
                            </div>
                    }
                </div>
            </div>
        </div>
    );
}

export default Modal;