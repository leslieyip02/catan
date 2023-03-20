import Resource from "./resource";
import Development from "./development";

type CardHand = {
    [key in Resource | Development]?: number;
};

function countCards(cards: CardHand): number {
    return Object.values(cards)
        .reduce((c1, c2) => c1 + c2, 0);
}

export { CardHand, countCards };