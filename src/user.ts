import { Resource, ResourceRoll } from "./game/board/resource";

interface UserProps {
    id: string;
    index: number;
    name: string;
    resources: { [key in Resource]?: number };
    resourceRolls: ResourceRoll[];
    settlements: number;
    cities: number;
    roads: number;
};

const defaultUserQuotas = {
    settlements: 5,
    cities: 4,
    roads: 15,
};

export { UserProps, defaultUserQuotas };