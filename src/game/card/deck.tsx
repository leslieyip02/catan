import { useState, useEffect, Fragment } from 'react';
import Card from ".";
import { CardHand, countCards } from "./hand";
import { defaultIcons } from "./default";
import Resource from './resource';
import { CardType } from '.';

interface DeckProps {
    cards: CardHand;
    drop?: boolean;
    stack?: boolean;
    hidden?: boolean;
    selectQuota?: number;
    actionLabel?: string;
    action?: (cards: CardHand) => void;
};

const Deck = (props: DeckProps) => {
    const [stack, setStack] = useState<boolean>(props.stack || false);
    const [selected, setSelected] = useState<CardHand>();
    const [hidden, setHidden] = useState<boolean>();

    useEffect(() => {
        setHidden(props.hidden);
    }, [props.hidden]);

    useEffect(() => {
        // stacking disallowed when an action needs to be taken
        if (props.action) {
            setSelected({});
        }
    }, [props.action]);

    function toggleSelect(card: Resource, select: boolean): boolean {
        if (!props.action) {
            return false;
        }

        if (props.selectQuota) {
            let currentCount = countCards(selected);
            let newCount = currentCount + (select ? 1 : -1);

            if (newCount > props.selectQuota) {
                return false;
            }
        }

        setSelected((currentSelected) => {
            let newSelected = { ...currentSelected };
            newSelected[card] = (newSelected[card] || 0) +
                (select ? 1 : -1);
            return newSelected;
        });

        return true;
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
            if (hidden) {
                setHidden(false);
            }

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
                                return (stack && !props.action)
                                    ? <Card
                                        key={`stacked-${card}`}
                                        card={card as CardType}
                                        label={`${quantity} x ${card}`}
                                    />
                                    : <Fragment key={`cards-${card}`}>
                                        {
                                            Array(quantity).fill(0)
                                                .map((_, index) => {
                                                    return <Card
                                                        key={`${card}-${index}`}
                                                        card={card as CardType}
                                                        label={card}
                                                        index={index}
                                                        hidden={hidden}
                                                        toggleSelect={toggleSelect}
                                                    />
                                                })
                                        }
                                    </Fragment>
                            })
                        : <Card card={"none"} label={"No cards"} />
                }
            </div>
        </div>
    );
}

export default Deck;