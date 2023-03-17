import { TerrainType } from "./tile";

enum Resource {
    brick = "brick",
    lumber = "lumber",
    ore = "ore",
    grain = "grain",
    wool = "wool",
    none = "none",
};

type ResourceRoll = {
    [key: number]: Resource;
};

function mapTerrainToResource(terrain: TerrainType): Resource {
    switch (terrain) {
        case TerrainType.hills:
            return Resource.brick;

        case TerrainType.forest:
            return Resource.lumber;

        case TerrainType.mountains:
            return Resource.ore;

        case TerrainType.fields:
            return Resource.grain;

        case TerrainType.pasture:
            return Resource.wool;

        default:
            return Resource.none;
    }
}

export default Resource;
export { ResourceRoll, mapTerrainToResource };