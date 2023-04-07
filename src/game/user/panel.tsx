import React, { useState, useEffect, useRef, FormEvent } from "react";
import { CardHand, countCards, differentCards, resourceCards } from "../card/hand";
import { defaultColors } from "../board/default";
import Deck from '../card/deck';
import { PlayerData } from ".";
import TradeForm from "../trade/form";
import Inventory from './inventory';
import Resource from "../card/resource";
import Harbor from "../board/harbor";
import { DatabaseReference } from "firebase/database";
import Development, { DevelopmentCardActions } from "../card/development";
import { defaultIcons } from "../card/default";

interface PanelProps extends PlayerData {
    userRef: DatabaseReference;
    thisPlayer: boolean;
    playerTurn: boolean;
    setupTurn: boolean;
    index: number;
    notification?: string;
    canPlaceRobber: boolean;
    needToSteal: boolean;
    allDiscarded: boolean;
    ongoingTrade: boolean;
    needToBuildRoads: boolean;
    rollDice?: () => void;
    stealCards: (targetId: string, cards: CardHand) => void;
    offerTrade: (targetId: string, offering: CardHand,
        requesting: CardHand) => Promise<string>;
    buyCard?: () => Promise<string>;
    cardActions?: DevelopmentCardActions;
    endTurn?: () => void;
};

const UserPanel = (props: PanelProps) => {
    const [cardCount, setCardCount] = useState<number>(0);
    const [rolled, setRolled] = useState<boolean>(false);

    // keep track of whether cards have changed
    const cards = useRef<CardHand>({});

    useEffect(() => {
        // check for card changes
        if (differentCards(cards.current, props.cards)) {
            cards.current = { ...props.cards };
            activatePanel();
        }

        setCardCount(countCards(props.cards || {}));
    }, [props.cards])

    useEffect(() => {

    }, [props.notification]);

    function activatePanel() {
        let panel: HTMLDivElement = document.querySelector(`#panel-${props.id}`);
        panel.style.width = "110%";

        setTimeout(() => {
            panel.style.width = "100%";
        }, 1200);
    }

    function inventoryProps() {
        return {
            id: props.id,
            index: props.index,
            name: props.name,
            cards: props.cards,
            cardCount: cardCount,
            thisPlayer: props.thisPlayer,
            playerTurn: props.playerTurn,
            cardActions: props.cardActions,
        };
    }

    const RollDiceButton = () => {
        function rollDice() {
            setRolled(true);
            props.rollDice();
        }

        let canRoll = props.playerTurn && !props.setupTurn && !rolled;

        return (
            <button
                className="panel__button"
                disabled={!canRoll}
                onClick={rollDice}
            >
                <i className="fa-solid fa-dice"></i>
                <span className="tooltip">Roll Dice</span>
            </button>
        );
    }

    const BuyCardButton = () => {
        const [tooltipText, setTooltipText] = useState<string>();

        useEffect(() => {
            if (tooltipText) {
                let formTooltip: HTMLSpanElement = document
                    .querySelector(`#buy-${props.id}`);
                formTooltip.style.visibility = "visible";

                setTimeout(() => {
                    formTooltip.style.visibility = "hidden";
                }, 2000);
            }
        }, [tooltipText]);

        // buy development cards
        function buyCard() {
            setTooltipText(null);
            props.buyCard()
                .then((bought) => setTooltipText(bought))
                .catch((rejected) => setTooltipText(rejected));
        }

        let canBuy = props.buyCard && props.playerTurn && rolled &&
            !props.setupTurn && !props.canPlaceRobber &&
            !props.needToSteal && !props.ongoingTrade &&
            !props.needToBuildRoads;

        return (
            <button
                className="panel__button"
                disabled={!canBuy}
                onClick={buyCard}
            >
                <i className="fa-solid fa-cart-shopping"></i>
                <span className="tooltip">
                    {
                        props.buyCard ? "Buy Card" : "No cards left"
                    }
                </span>
                <span
                    id={`buy-${props.id}`}
                    className="tooltip"
                    style={{ visibility: "hidden" }}
                >
                    {tooltipText}
                </span>
            </button>
        );
    }

    const MaritimeTradeButton = () => {
        // basic 4 : 1 trade
        let canTrade = props.playerTurn && rolled &&
            !props.setupTurn && !props.canPlaceRobber &&
            !props.needToSteal && !props.ongoingTrade &&
            !props.needToBuildRoads;

        return (
            <button
                className="panel__button"
                disabled={!canTrade}
            >
                <Harbor
                    userRef={props.userRef}
                    playerTurn={props.playerTurn}
                    setupTurn={props.setupTurn}
                    cards={cards}
                    rolled={rolled}
                    canPlaceRobber={props.canPlaceRobber}
                    needToSteal={props.needToSteal}
                    allDiscarded={props.allDiscarded}
                    ongoingTrade={props.ongoingTrade}
                    access={[]}
                    resource={Resource.none}
                />
            </button>
        );
    }

    const StealButton = ({ cards }: { cards: CardHand }) => {
        function toggleHide() {
            let stealMenu: HTMLDivElement = document.querySelector(`#steal-menu-${props.id}`);
            stealMenu.style.display = "flex";
        }

        function stealCard(cards: CardHand) {
            setTimeout(() => {
                props.stealCards(props.id, cards);
            }, 2000);
        }

        return (
            <div
                className="panel__button"
                onClick={toggleHide}
            >
                <i className="fa-solid fa-user-minus"></i>
                <span className="tooltip">Steal 1 resource</span>
                <div
                    id={`steal-menu-${props.id}`}
                    className="overlay"
                    style={{ display: "none" }}
                >
                    <Deck
                        cards={resourceCards(cards)}
                        drop={true}
                        hidden={true}
                        selectQuota={1}
                        actionLabel={"Steal 1"}
                        deckAction={stealCard}
                    />
                </div>
            </div>
        );
    }

    const EndTurnButton = () => {
        function endTurn() {
            setRolled(false);
            props.endTurn();
        }

        let canEnd = props.playerTurn && !props.setupTurn &&
            !props.canPlaceRobber && !props.ongoingTrade &&
            !props.needToSteal && props.allDiscarded &&
            !props.needToBuildRoads && rolled;

        return (
            <button
                className="panel__button"
                disabled={!canEnd}
                onClick={endTurn}
            >
                <i className="fa-solid fa-square-check"></i>
                <span className="tooltip">End Turn</span>
            </button>
        );
    }

    return (
        <div id={`panel-${props.id}`} className="panel">
            <div className="panel__info">
                <div className="panel__row">
                    <div className="panel__name">{props.name}</div>
                    {
                        props.playerTurn && <i className="fa-solid fa-gamepad"></i>
                    }
                </div>
                <div className="panel__row">
                    <Inventory {...inventoryProps()} />
                    <div className="panel__buttons">
                        {
                            props.thisPlayer
                                ? <>
                                    <RollDiceButton />
                                    <BuyCardButton />
                                    <MaritimeTradeButton />
                                    <EndTurnButton />
                                </>
                                : <TradeForm {...props} />
                        }
                        {
                            props.canStealFrom && props.needToSteal &&
                            <StealButton cards={props.cards} />
                        }
                    </div>
                </div>
            </div>
            <div
                className="panel__tab"
                style={{ backgroundColor: defaultColors[props.index] }}
            >
                {
                    props.thisPlayer && <i className="fa-regular fa-user"></i>
                }
                <span
                    className="panel__notification"
                    style={{ opacity: (props.playerTurn && props.notification) ? "100%" : "0%" }}
                >
                    <div className="panel__notification-content">
                        {
                            props.notification in Development
                                ? <i className={`${defaultIcons[props.notification].join(" ")}`}>
                                    <span className="tooltip">{props.notification}</span>
                                </i>
                                : props.notification
                        }
                    </div>
                </span>
            </div>
        </div>
    );
}

export default UserPanel;
export { PanelProps };