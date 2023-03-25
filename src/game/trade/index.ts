import { child, update, increment, DatabaseReference } from "firebase/database";
import { CardType } from "../card";
import { CardHand } from "../card/hand";

interface TradeOffer {
    fromId?: string;
    fromName?: string;
    offering: CardHand;
    requesting: CardHand;
}

function hasRequiredCards(cards: CardHand, required: CardHand): boolean {
    let card: CardType;
    for (card in required) {
        if (!cards[card] ||
            cards[card] < required[card]) {
            return false
        }
    }

    return true;
}

function tradeResources(targetRef: DatabaseReference,
    offer: TradeOffer) {
    let transfer: Record<string, number> = {};

    for (let [card, quantity] of Object.entries(offer.offering)) {
        transfer[card] = (transfer[card] || 0) - quantity;
    }

    for (let [card, quantity] of Object.entries(offer.requesting)) {
        transfer[card] = (transfer[card] || 0) + quantity;
    }

    let cardsRef = child(targetRef, "cards");
    update(cardsRef, Object.fromEntries(Object.entries(transfer)
        .map(([card, quantity]) => [card, increment(quantity)])));
}

export { TradeOffer, hasRequiredCards, tradeResources };