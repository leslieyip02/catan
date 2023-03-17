enum Infrastructure {
    none = 0,
    settlement = 1,
    city = 2,
    road = 3,
};

type InfrastructureQuota = {
    [key in Infrastructure]?: number;
};

let defaultInfrastructure: InfrastructureQuota = {
    [Infrastructure.settlement]: 2,
    [Infrastructure.road]: 2,
};

export default Infrastructure;
export { InfrastructureQuota, defaultInfrastructure };