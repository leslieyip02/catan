enum Development {
    knight = "knight",
    roadBuilding = "road building",
    yearOfPlenty = "year of plenty",
    monopoly = "monopoly",
    victoryPoint = "victory point",
};

type DevelopmentStock = {
    [key in Development]?: number;
};

export default Development;
export { DevelopmentStock };