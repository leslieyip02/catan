import { useState, useEffect, Fragment } from 'react';
import Card from ".";
import { CardHand, countCards } from "./hand";
import { defaultIcons } from "./default";
import Resource from './resource';

interface DeckProps {
    cards: CardHand;
    drop?: boolean;
    stack?: boolean;
    actionLabel?: string;
    action?: (cards: CardHand) => void;
};

const Deck = (props: DeckProps) => {
    const [stack, setStack] = useState<boolean>(props.stack || false);
    const [selected, setSelected] = useState<CardHand>();

    useEffect(() => {
        // stacking disallowed when an action needs to be taken
        if (props.action) {
            setSelected({});
        }
    }, [props.action]);

    function stackedCardProps(card: Resource, quantity: number) {
        return {
            iconClassNames: defaultIcons[card],
            label: `${quantity} x ${card}`,
        };
    }

    function singleCardProps(card: Resource) {
        function toggleSelect(selected: boolean) {
            setSelected((currentSelected) => {
                let newSelected = { ...currentSelected };
                newSelected[card] = (newSelected[card] || 0) +
                    (selected ? 1 : -1);
                return newSelected;
            });
        }

        return {
            iconClassNames: defaultIcons[card],
            label: card,
            toggleSelect: props.action ? toggleSelect : null,
        };
    }

    const StackButton = () => {
        function stack(e: React.FormEvent) {
            e.stopPropagation();
            setStack((current) => !current);
        }

        return (
            <button
                className="deck__button"
                onClick={stack}>
                <i className="fa-solid fa-layer-group"></i>
            </button>
        );
    }

    const ActionButton = () => {
        function takeAction() {
            props.action(selected);
        }

        return (
            <button
                className="deck__button"
                onClick={takeAction}>
                <i className="fa-solid fa-square-check"></i>
                <span className="tooltip">{props.actionLabel}</span>
            </button>
        );
    }

    return (
        <div className={`deck${props.drop ? " deck--drop" : ""}`}>
            {
                countCards(props.cards) > 0 && (
                    props.action
                        ? <ActionButton />
                        : <StackButton />
                )
            }
            <div className="deck__cards">
                {
                    countCards(props.cards) > 0
                        ? Object.entries(props.cards)
                            .filter(([_, quantity]) => quantity > 0)
                            .map(([card, quantity]) => {
                                return stack && !props.action
                                    ? <Card
                                        key={`stacked-${card}`}
                                        {...stackedCardProps(card as Resource, quantity)}
                                    />
                                    : <Fragment key={`cards-${card}`}>
                                        {
                                            Array(quantity).fill(0)
                                                .map((_, index) => {
                                                    return <Card
                                                        key={`${card}-${index}`}
                                                        {...singleCardProps(card as Resource)}
                                                    />
                                                })
                                        }
                                    </Fragment>
                            })
                        : <Card
                            iconClassNames={["fa-solid", "fa-face-frown"]}
                            label={"No cards"}
                        />
                }
            </div>
        </div>
    );
}

export default Deck;