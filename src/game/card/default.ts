import Resource from "./resource";

let defaultIcons: Record<string, string[]> = {
    [Resource.brick]: ["fa-solid", "fa-trowel-bricks"],
    [Resource.grain]: ["fa-solid", "fa-wheat-awn"],
    [Resource.lumber]: ["fa-solid", "fa-tree"],
    [Resource.ore]: ["fa-solid", "fa-mountain"],
    [Resource.wool]: ["fa-solid", "fa-cloud"],
};

export { defaultIcons };