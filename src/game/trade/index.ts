import Resource from "../card/resource";
import { CardHand } from "../card/hand";

interface TradeData {
    parties: [string, string];
    transfer: [CardHand, CardHand];
};

interface TradeOffer {
    fromId: string;
    fromName: string;
    offering: CardHand;
    requesting: CardHand;
}

export { TradeData, TradeOffer };