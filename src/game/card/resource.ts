import { Coordinate } from "../board";
import { Terrain } from "../board/tile";

enum Resource {
    none = "none",
    brick = "brick",
    lumber = "lumber",
    ore = "ore",
    grain = "grain",
    wool = "wool",
};

type ResourceRoll = {
    [key: number]: Resource;
    tile: Coordinate;
};

function mapTerrainToResource(terrain: Terrain): Resource {
    switch (terrain) {
        case Terrain.hills:
            return Resource.brick;

        case Terrain.forest:
            return Resource.lumber;

        case Terrain.mountains:
            return Resource.ore;

        case Terrain.fields:
            return Resource.grain;

        case Terrain.pasture:
            return Resource.wool;

        default:
            return Resource.none;
    }
}

export default Resource;
export { ResourceRoll, mapTerrainToResource };