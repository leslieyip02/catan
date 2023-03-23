import { ResourceRoll } from "../card/resource";
import { CardHand } from "../card/hand";

interface PlayerData {
    id: string;
    index: number;
    name: string;
    cards: CardHand;
    settlements: number;
    cities: number;
    roads: number;
    canStealFrom?: boolean;
};

interface UserData extends PlayerData {
    roomId: string;
    resourceRolls: ResourceRoll[];
};

const defaultUserQuotas = {
    settlements: 5,
    cities: 4,
    roads: 15,
};

export { UserData, PlayerData, defaultUserQuotas };