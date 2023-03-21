import { CardType } from ".";

type CardHand = {
    [key in CardType]?: number;
};

function countCards(cards: CardHand): number {
    return Object.values(cards || {})
        .reduce((c1, c2) => c1 + c2, 0);
}

function differentCards(original: CardHand, current: CardHand): boolean {
    let card: CardType;
    for (card in original) {
        if (!current[card] === undefined ||
            current[card] !== 0 &&
            current[card] !== original[card]) {
            return true;
        }
    }

    for (card in current) {
        if (!original[card] === undefined ||
            original[card] !== 0 &&
            original[card] !== current[card]) {
            return true;
        }
    }

    return false;
}

export { CardHand, countCards, differentCards };