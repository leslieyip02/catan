import { update, increment, child, DatabaseReference } from 'firebase/database';
import { CardHand } from '../card/hand';
import Resource from '../card/resource';
import { defaultInfrastructureCosts } from './default';

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

type InfrastructureCosts = {
    [key in Infrastructure]?: {
        [key in Resource]?: number;
    };
};

function hasSufficientResources(infrastructure: Infrastructure,
    cards: React.MutableRefObject<CardHand>): boolean {
    let cost = defaultInfrastructureCosts[infrastructure];

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

    let costs = Object.fromEntries(Object.entries(defaultInfrastructureCosts[infrastructure])
        .map(([resource, quantity]) => [resource, increment(quantity * -1)]));

    update(child(userRef, "cards"), costs);
}

export default Infrastructure;
export { InfrastructureQuota, InfrastructureCosts, hasSufficientResources, deductResources };