import Resource from "./resource";
import Development from "./development";
import { useState, useEffect } from 'react';

type CardType = `${Resource}` | `${Development}`;

interface CardProps {
    iconClassNames: string[];
    label: string;
    toggleSelect?: (selected: boolean) => void;
};

const Card = (props: CardProps) => {
    const [selected, setSelected] = useState<boolean>(false);

    useEffect(() => {
        if (props.toggleSelect) {
            props.toggleSelect(selected);
        }
    }, [selected]);

    function selectCard(e: React.FormEvent) {
        e.stopPropagation();
        setSelected((currentSelected) => !currentSelected);
    }

    return (
        <div
            className={`card${selected ? " card--selected" : ""}`}
            onClick={(e) => props.toggleSelect ? selectCard(e) : {}}
        >
            <i className={`${["card__icon", ...props.iconClassNames].join(" ")}`}></i>
            <div className="card__label">{props.label}</div>
        </div>
    );
}

export default Card;
export { CardType };