import { Coordinate } from '.';
enum Terrain {
    hills = "hills",
    forest = "forest",
    mountains = "mountains",
    fields = "fields",
    pasture = "pasture",
    desert = "desert",
};

interface TileProps {
    terrain: Terrain;
    roll: number;
    robber?: boolean
    placeRobber?: () => void;
};

function Tile(props: TileProps) {
    return (
        <div
            className={`tile${!props.placeRobber || props.robber ? " tile--disabled" : ""}`}
            data-terrain={props.terrain}
            onClick={props.placeRobber}
        >
            <div className="tile__text">
                {
                    props.robber && <i className="fa-solid fa-user-minus"></i> ||
                    props.roll
                }
            </div>
        </div>
    );
};

export default Tile;
export { Terrain };