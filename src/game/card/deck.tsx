import { useState, useEffect, useRef, Fragment } from 'react';
import Card from ".";
import { CardHand, countCards, developmentCards, resourceCards } from "./hand";
import Resource from './resource';
import { CardType } from '.';
import { randomInt } from '../random';
import Development, { DevelopmentCardActions, developmentLabels } from './development';

interface DeckProps {
    cards: CardHand;
    drop?: boolean;
    stack?: boolean;
    hidden?: boolean;
    selectQuota?: number;
    actionLabel?: string;
    playerTurn?: boolean;
    deckAction?: (cards: CardHand) => void;
    cardActions?: DevelopmentCardActions;
};

const Deck = (props: DeckProps) => {
    const [stack, setStack] = useState<boolean>(props.stack || false);
    const [hidden, setHidden] = useState<boolean>();

    // keep separate references to prevent re-render
    const selected = useRef<CardHand>();
    const shuffledCards = useRef<CardType[]>();

    useEffect(() => {
        if (props.hidden) {
            // this causes the HiddenCards component to shuffle
            shuffledCards.current = null;
        }

        setHidden(props.hidden);
    }, [props.hidden]);

    useEffect(() => {
        // stacking disallowed when an action needs to be taken
        if (props.deckAction) {
            selected.current = {};
        }
    }, [props.deckAction]);

    function toggleSelect(card: Resource, select: boolean): boolean {
        if (!props.deckAction) {
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

            props.deckAction(selected.current);
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
        if (!shuffledCards.current) {
            shuffledCards.current = Object.entries(cards)
                .map(([card, quantity]) => Array(quantity).fill(card))
                .flat();
            let c = shuffledCards.current.length;
            for (let shuffleCount = randomInt(1, c); shuffleCount > 0; shuffleCount--) {
                let i1 = randomInt(0, c);
                let i2 = randomInt(0, c);

                let c1 = shuffledCards.current[i1];
                shuffledCards.current[i1] = shuffledCards.current[i2];
                shuffledCards.current[i2] = c1;
            }
        }

        return (
            <>
                {
                    shuffledCards.current
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

    const Cards = ({ cards, stack }: { cards: CardHand, stack: boolean }) => {
        function cardAction(card: CardType) {
            if (!props.playerTurn) {
                return null;
            }

            return props.cardActions[card as Development] || null;
        }

        return (
            <>
                {
                    Object.entries(cards)
                        .filter(([_, quantity]) => quantity > 0)
                        .map(([card, quantity]) => {
                            return (stack && !props.deckAction)
                                ? <Card
                                    key={`stacked-${card}`}
                                    card={card as CardType}
                                    quantity={quantity}
                                />
                                : <Fragment key={`cards-${card}`}>
                                    {
                                        Array(quantity).fill(0)
                                            .map((_, index) => {
                                                return <Card
                                                    key={`${card}-${index}`}
                                                    card={card as CardType}
                                                    label={developmentLabels[card] || card}
                                                    index={index}
                                                    hidden={hidden}
                                                    toggleSelect={toggleSelect}
                                                    action={cardAction(card as CardType)}
                                                />
                                            })
                                    }
                                </Fragment>
                        })
                }
            </>
        );
    }

    return (
        <div className={`deck${props.drop ? " deck--drop" : ""}`}>
            {
                countCards(props.cards) > 0 && (
                    props.deckAction
                        ? <ActionButton />
                        : <StackButton />
                )
            }
            <div className="deck__cards">
                {
                    props.hidden
                        ? <HiddenCards cards={props.cards} />
                        : countCards(props.cards) > 0
                            ? <>
                                <Cards cards={resourceCards(props.cards)} stack={stack} />
                                <Cards cards={developmentCards(props.cards)} stack={false} />
                            </>
                            : <Card card={"none"} label={"No cards"} />
                }
            </div>
        </div>
    );
}

export default Deck;