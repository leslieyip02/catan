import { Resource, ResourceRoll } from "./game/board/resource";

interface UserProps {
    id: string;
    index?: number;
    name?: string;
    color?: string;
    resources?: { [key in Resource]?: number };
    resourceRolls?: ResourceRoll[];
    settlements?: number;
    cities?: number;
    roads?: number;
};

const userColors = [
    "#d82306",
    "#8cda52",
    "#4897f2",
    "#ffff85",
];

const defaultUserQuotas = {
    settlements: 5,
    cities: 4,
    roads: 15,
};

export { UserProps, userColors, defaultUserQuotas };