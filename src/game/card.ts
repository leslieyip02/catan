import Resource from "./board/resource";

enum DevelopmentCard {
    knight = "knight",
    progress = "progress",
    victoryPoint = "victoryPoint",
};

type CardHand = {
    [key in Resource | DevelopmentCard]?: number;
};

function countCards(cards: CardHand): number {
    return Object.values(cards)
        .reduce((c1, c2) => c1 + c2, 0);
}

export { DevelopmentCard, CardHand, countCards };