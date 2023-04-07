import { CardType } from ".";
import Development from "./development";
import Resource from "./resource";

type CardHand = {
    [key in CardType]?: number;
};

function resourceCards(cards: CardHand): CardHand {
    return Object.fromEntries(Object.entries(cards || {})
        .filter(([card, _]) => card in Resource));
}

function developmentCards(cards: CardHand) : CardHand {
    return Object.fromEntries(Object.entries(cards || {})
        .filter(([card, _]) => card in Development));
}

function countCards(cards: CardHand): number {
    return Object.values(cards || {})
        .reduce((c1, c2) => c1 + c2, 0);
}

function countResourceCards(cards: CardHand): number {
    return Object.entries(resourceCards(cards))
        .map(([_, quantity]) => quantity)
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

export {
    CardHand,
    resourceCards,
    developmentCards,
    countCards,
    countResourceCards,
    differentCards
};