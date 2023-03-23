import Resource from "./resource";

let defaultIcons: Record<string, string[]> = {
    [Resource.none]: ["fa-solid", "fa-face-frown"],
    [Resource.brick]: ["fa-solid", "fa-trowel-bricks"],
    [Resource.grain]: ["fa-solid", "fa-wheat-awn"],
    [Resource.lumber]: ["fa-solid", "fa-tree"],
    [Resource.ore]: ["fa-solid", "fa-mountain"],
    [Resource.wool]: ["fa-solid", "fa-cloud"],
    "unknown": ["fa-solid", "fa-circle-question"],
};

export { defaultIcons };