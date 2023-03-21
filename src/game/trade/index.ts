import { CardType } from "../card";
import { CardHand } from "../card/hand";

interface TradeOffer {
    fromId: string;
    fromName: string;
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

export { TradeOffer, hasRequiredCards };