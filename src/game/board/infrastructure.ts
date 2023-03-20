import { update, increment, child, DatabaseReference } from 'firebase/database';
import { CardHand } from '../card/hand';
import Resource from '../card/resource';

enum Infrastructure {
    none = 0,
    settlement = 1,
    city = 2,
    road = 3,
};

type InfrastructureQuota = {
    [Infrastructure.settlement]: number;
    [Infrastructure.road]: number;
};

let defaultInfrastructure: InfrastructureQuota = {
    [Infrastructure.settlement]: 2,
    [Infrastructure.road]: 2,
};

type InfrastructureCosts = {
    [key in Infrastructure]?: {
        [key in Resource]?: number;
    };
};

let infrastructureCosts: InfrastructureCosts = {
    [Infrastructure.settlement]: {
        [Resource.brick]: 1,
        [Resource.grain]: 1,
        [Resource.lumber]: 1,
        [Resource.wool]: 1,
    },
    [Infrastructure.city]: {
        [Resource.grain]: 2,
        [Resource.ore]: 3,
    },
    [Infrastructure.road]: {
        [Resource.brick]: 1,
        [Resource.lumber]: 1,
    },
};

function hasSufficientResources(infrastructure: Infrastructure,
    cards: React.MutableRefObject<CardHand>): boolean {
    let cost = infrastructureCosts[infrastructure];

    let resource: `${Resource}`;
    for (resource in cost) {
        let quantity = cost[resource];
        if (!cards.current[resource] ||
            cards.current[resource] < quantity) {
            return false;
        }
    }

    return true;
}

function deductResources(infrastructure: Infrastructure,
    userRef: DatabaseReference) {

    let costs = Object.fromEntries(Object.entries(infrastructureCosts[infrastructure])
        .map(([resource, quantity]) => [resource, increment(quantity * -1)]));

    update(child(userRef, "cards"), costs);
}

export default Infrastructure;
export { InfrastructureQuota, defaultInfrastructure, hasSufficientResources, deductResources };