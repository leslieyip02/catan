import { TradeOffer } from ".";
import Deck from "../card/deck";

interface MenuProps {
    offer: TradeOffer;
    canAccept: boolean;
    processOffer: (accept: boolean, offer?: TradeOffer) => void;
};

// menu for trade offers received
const Menu = (props: MenuProps) => {
    const AcceptButton = () => {
        return (
            <button
                className="menu__button"
                disabled={!props.canAccept}
                onClick={() => props.processOffer(true, props.offer)}
            >
                <i className="menu__icon fa-solid fa-square-check">
                    <span className="tooltip">Accept</span>
                </i>
            </button>
        );
    }

    const RejectButton = () => {
        return (
            <button
                className="menu__button"
                onClick={() => props.processOffer(false)}
            >
                <i className="menu__icon fa-solid fa-square-xmark">
                    <span className="tooltip">Reject</span>
                </i>
            </button>
        );
    }

    return (
        <div className="overlay menu" style={{ display: "flex" }}>
            <div className="menu__label">
                Trade Offer from {props.offer.fromName}
            </div>
            <div className="menu__offering">
                <Deck cards={props.offer.offering} />
            </div>
            <div className="menu__transfer">
                <i className="menu__icon fa-solid fa-arrow-down"></i>
                <div className="menu__buttons">
                    <AcceptButton />
                    <RejectButton />
                </div>
                <i className="menu__icon fa-solid fa-arrow-up"></i>
            </div>
            <div className="menu__requesting">
                <Deck cards={props.offer.requesting} />
            </div>
        </div>
    );
}

export default Menu;