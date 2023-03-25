import { DatabaseReference } from "firebase/database";
import { TradeOffer, tradeResources } from ".";
import Resource from "../card/resource";

function exchangeResources(targetRef: DatabaseReference,
    offering: Resource, requesting: Resource, ratio: number) {

    let offer: TradeOffer = {
        offering: { [offering]: ratio },
        requesting: { [requesting]: 1 },
    };

    tradeResources(targetRef, offer);
}

export { exchangeResources };