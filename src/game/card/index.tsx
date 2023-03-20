import Resource from "./resource";

interface CardProps {
    iconClassNames: string[];
    label: string;
};

function Card(props: CardProps) {
    return (
        <div className="deck__card">
            <i className={`${["deck__card-icon", ...props.iconClassNames].join(" ")}`}></i>
            <div className="deck__card-label">{props.label}</div>
        </div >
    );
}

export default Card;