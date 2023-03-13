import { TerrainType } from "./tile";

enum Resource {
    brick = "brick",
    lumber = "lumber",
    ore = "ore",
    grain = "grain",
    wool = "wool",
    none = "none",
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

interface resourceRoll {
    [key: number]: Resource,
};

export { Resource, mapTerrainToResource, resourceRoll };