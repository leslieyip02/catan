import Resource from "./resource";

interface CardProps {
    iconClassNames: string[];
    label: string;
};

const Card = (props: CardProps) => {
    return (
        <div className="card">
            <i className={`${["card__icon", ...props.iconClassNames].join(" ")}`}></i>
            <div className="card__label">{props.label}</div>
        </div>
    );
}

export default Card;