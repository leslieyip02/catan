import Resource, { ResourceRoll } from "./game/card/resource";
import { CardHand } from "./game/card/hand";

interface UserData {
    id: string;
    roomId: string;
    index: number;
    name: string;
    cards: CardHand;
    resourceRolls: ResourceRoll[];
    settlements: number;
    cities: number;
    roads: number;
};

interface PlayerData extends Omit<UserData, "roomId" | "resourceRolls"> { };

const defaultUserQuotas = {
    settlements: 5,
    cities: 4,
    roads: 15,
};

export { UserData, PlayerData, defaultUserQuotas };