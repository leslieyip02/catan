import Resource from "./board/resource";

enum DevelopmentCard {
    knight = "knight",
    progress = "progress",
    victoryPoint = "victoryPoint",
};

type CardHand = {
    [key in Resource | DevelopmentCard]?: number;
};

export { CardHand, DevelopmentCard };