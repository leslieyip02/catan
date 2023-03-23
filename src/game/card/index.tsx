import Resource from "./resource";
import Development from "./development";
import { useState, useEffect } from 'react';
import { defaultIcons } from "./default";

type CardType = `${Resource}` | `${Development}`;

interface CardProps {
    card: CardType;
    label: string;
    index?: number;
    hidden?: boolean;
    toggleSelect?: (card: CardType, selected: boolean) => boolean;
};

const Card = (props: CardProps) => {
    const [selected, setSelected] = useState<boolean>(false);
    const [hidden, setHidden] = useState<boolean>();

    useEffect(() => {
        if (props.hidden === false) {
            let card: HTMLDivElement = document.querySelector(`#${props.card}-${props.index}`);
            card.classList.add("card--flip");

            // delay is for the animation
            setTimeout(() => {
                setHidden(props.hidden);
            }, 500);
        } else {
            setHidden(props.hidden);
        }
    }, [props.hidden]);

    function selectCard(e: React.FormEvent) {
        e.stopPropagation();

        if (props.toggleSelect(props.card, !selected)) {
            setSelected((currentSelected) => !currentSelected);
        }
    }

    function icons() {
        return ["card__icon", ...(hidden
            ? defaultIcons["unknown"]
            : defaultIcons[props.card])]
    }

    return (
        <div
            id={`${props.card}-${props.index}`}
            className={`card${selected ? " card--selected" : ""}`}
            onClick={(e) => props.toggleSelect ? selectCard(e) : {}}
        >
            <i className={`${icons().join(" ")}`}></i>
            <div className="card__label">{hidden ? "???" : props.label}</div>
        </div>
    );
}

export default Card;
export { CardType };