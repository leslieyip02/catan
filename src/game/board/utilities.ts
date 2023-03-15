enum Infrastructure {
    none = 0,
    settlement = 1,
    city = 2,
    road = 3,
};

interface Coordinate {
    x: number,
    y: number,
}

export { Infrastructure, Coordinate };