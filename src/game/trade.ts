import Resource from "./card/resource";
import { CardHand } from "./card/hand";

interface TradeData {
    parties: [string, string];
    transfer: [CardHand, CardHand];
};

interface TradeOffer {
    from: string;
    requesting: CardHand;
    offering: CardHand;
}

export { TradeData, TradeOffer };