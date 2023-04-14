import Development, { DevelopmentStock } from "./development";
import Resource from "./resource";

let defaultIcons: Record<string, string[]> = {
    [Resource.none]: ["fa-solid", "fa-face-frown"],
    [Resource.brick]: ["fa-solid", "fa-trowel-bricks"],
    [Resource.grain]: ["fa-solid", "fa-wheat-awn"],
    [Resource.lumber]: ["fa-solid", "fa-tree"],
    [Resource.ore]: ["fa-solid", "fa-mountain"],
    [Resource.wool]: ["fa-solid", "fa-cloud"],
    [Development.knight]: ["fa-solid", "fa-chess-knight"],
    [Development.roadBuilding]: ["fa-solid", "fa-road"],
    [Development.yearOfPlenty]: ["fa-solid", "fa-coins"],
    [Development.monopoly]: ["fa-solid", "fa-hand-holding-dollar"],
    [Development.victoryPoint]: ["fa-solid", "fa-trophy"],
    "unknown": ["fa-solid", "fa-circle-question"],
};

// development cards do not go back into circulation
let defaultDevelopmentCards: DevelopmentStock = {
    [Development.knight]: 14,
    [Development.roadBuilding]: 2,
    [Development.yearOfPlenty]: 2,
    [Development.monopoly]: 2,
    [Development.victoryPoint]: 5,
}

// longest road ≥ 5
let defaultLongestRoad = 4;
// largest army ≥ 3
let defaultLargestArmy = 2;

export {
    defaultIcons,
    defaultDevelopmentCards,
    defaultLongestRoad,
    defaultLargestArmy,
};