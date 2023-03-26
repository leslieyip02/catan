import { useState, useEffect, useRef, Fragment } from 'react';
import Card from ".";
import { CardHand, countCards } from "./hand";
import { defaultIcons } from "./default";
import Resource from './resource';
import { CardType } from '.';
import { randomInt } from '../random';

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
    const [hidden, setHidden] = useState<boolean>();

    // prevent re-render on select
    const selected = useRef<CardHand>();

    useEffect(() => {
        setHidden(props.hidden);
    }, [props.hidden]);

    useEffect(() => {
        // stacking disallowed when an action needs to be taken
        if (props.action) {
            selected.current = {};
        }
    }, [props.action]);

    function toggleSelect(card: Resource, select: boolean): boolean {
        if (!props.action) {
            return false;
        }

        if (props.selectQuota) {
            let currentCount = countCards(selected.current);
            let newCount = currentCount + (select ? 1 : -1);

            if (newCount > props.selectQuota) {
                return false;
            }
        }

        selected.current[card] = (selected.current[card] || 0) +
            (select ? 1 : -1);

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
            // props.hidden refers to whether this deck is initially hidden
            // hidden refers to the current state, 
            // so the hidden cards should be revealed when action is taken
            if (hidden) {
                setHidden(false);
            }

            props.action(selected.current);
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

    const HiddenCards = ({ cards }: { cards: CardHand }) => {
        let shuffledCards: CardType[] = Object.entries(cards)
            .map(([card, quantity]) => Array(quantity).fill(card))
            .flat();
        let c = shuffledCards.length;
        for (let shuffleCount = randomInt(1, c); shuffleCount > 0; shuffleCount--) {
            let i1 = randomInt(0, c);
            let i2 = randomInt(0, c);

            let c1 = shuffledCards[i1];
            shuffledCards[i1] = shuffledCards[i2];
            shuffledCards[i2] = c1;
        }

        return (
            <>
                {
                    shuffledCards
                        .map((card, index) => {
                            return <Card
                                key={`hidden-card-${index}`}
                                card={card as CardType}
                                label={card}
                                index={index}
                                hidden={hidden}
                                toggleSelect={toggleSelect}
                            />
                        })
                }
            </>
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
                    props.hidden
                        ? <HiddenCards cards={props.cards} />
                        : countCards(props.cards) > 0
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