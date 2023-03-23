import { useState } from "react";
import Deck from '../card/deck';
import { CardHand } from "../card/hand";

interface InventoryProps {
    id: string;
    index: number;
    name: string;
    cards: CardHand;
    cardCount: number;
    thisPlayer: boolean;
    playerTurn: boolean;
};

const Inventory = (props: InventoryProps) => {
    const [open, setOpen] = useState<boolean>(false);

    function toggleHide() {
        if (props.thisPlayer) {
            let inventory: HTMLDivElement = document.querySelector(`#inventory-${props.id}`);
            setOpen((currentOpen) => {
                inventory.style.display = currentOpen ? "none" : "block";
                return !currentOpen;
            });
        }
    }

    return (
        <div className="panel__cards" onClick={toggleHide}>
            <span>
                {props.cardCount}x<i className="panel__card-icon fa-solid fa-money-bill"></i>
            </span>
            {
                props.thisPlayer && <div
                    id={`inventory-${props.id}`}
                    className="overlay"
                    style={{ display: open ? "block" : "none" }}
                >
                    <Deck cards={props.cards} drop={true} />
                </div>
            }
        </div>
    );
}

export default Inventory;