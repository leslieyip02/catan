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

    const CardContent = () => {
        return (
            hidden
                ? <>
                    <i className={`card__icon ${defaultIcons["unknown"].join(" ")}`}></i>
                    <div className="card__label">"???"</div>
                </>
                : <>
                    <i className={`card__icon ${defaultIcons[props.card].join(" ")}`}></i>
                    <div className="card__label">{props.label}</div>
                </>
        );
    }

    return (
        <div
            id={`${props.card}-${props.index}`}
            className={`card${selected ? " card--selected" : ""}`}
            onClick={(e) => props.toggleSelect ? selectCard(e) : {}}
        >
            <CardContent />
        </div>
    );
}

export default Card;
export { CardType };