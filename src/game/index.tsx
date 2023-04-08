import { useState, useEffect, useRef, useCallback } from 'react';
import { ref, get, set, child, onValue, Database, DatabaseReference, off, increment, update } from "firebase/database";
import Board from "./board";
import Chat from "./chat";
import Panel from "./user/panel";
import { UserData, PlayerData } from "./user";
import { randomInt } from './random';
import Resource, { ResourceRoll } from './card/resource';
import { CardHand, countCards, countResourceCards, resourceCards } from './card/hand';
import { broadcastMessage } from './chat';
import { Terrain } from './board/tile';
import { Coordinate } from './board';
import { InfrastructureQuota } from './board/infrastructure';
import { tradeResources, hasRequiredCards, TradeOffer } from './trade';
import TradeMenu from './trade/domestic';
import Deck from './card/deck';
import Card from './card/index';
import { CardType } from './card/';
import { defaultInfrastructure } from './board/default';
import Development, { DevelopmentCardActions, DevelopmentStock } from './card/development';
import { defaultDevelopmentCards } from './card/default';
import Infrastructure from './board/infrastructure';

interface GameProps {
    db: Database;
    userRef: DatabaseReference;
    roomRef: DatabaseReference;
    userIndex: number;
    userName: string;
};

const Game = (props: GameProps) => {
    // user data
    const [host, setHost] = useState<boolean>(false);
    const [players, setPlayers] = useState<PlayerData[]>([]);
    const [playerRefs, setPlayerRefs] = useState<DatabaseReference[]>([]);
    const [playerCount, setPlayerCount] = useState<number>();

    // game turn data
    const [started, setStarted] = useState<boolean>(false);
    const [turn, setTurn] = useState<number>(0);
    const [playerTurn, setPlayerTurn] = useState<boolean>(false);
    const [setupTurn, setSetupTurn] = useState<boolean>(false);

    // game activity data
    const [notification, setNotification] = useState<string | Development>();
    const [messages, setMessages] = useState<string[]>([]);
    const [robber, setRobber] = useState<Coordinate>();
    const [canPlaceRobber, setCanPlaceRobber] = useState<boolean>();
    const [allDiscarded, setAllDiscarded] = useState<boolean>(true);
    const [needToDiscard, setNeedToDiscard] = useState<number>(0);
    const [needToSteal, setNeedToSteal] = useState<boolean>();
    const [tradeOffer, setTradeOffer] = useState<TradeOffer>();
    const [ongoingTrade, setOngoingTrade] = useState<boolean>(false);
    const [needToBuildRoads, setNeedToBuildRoads] = useState<boolean>(false);
    const [needToDrawCards, setNeedToDrawCards] = useState<boolean>(false);
    const [needToMonopoly, setNeedToMonopoly] = useState<boolean>(false);

    // keep separate reference
    const cards = useRef<CardHand>({});
    const quota = useRef<InfrastructureQuota>(defaultInfrastructure);
    const stock = useRef<DevelopmentStock>(defaultDevelopmentCards);

    useEffect(() => {
        // check if this user is the host
        get(child(props.roomRef, "host"))
            .then((host) => setHost(host.val() === props.userRef.key));

        // listen for game start
        let gameStartRef = child(props.roomRef, "started");
        onValue(gameStartRef, (gameStart) => {
            if (gameStart.val()) {
                setStarted(true);

                // get a list of the room's users
                get(child(props.roomRef, "users"))
                    .then((currentUsers) => {
                        let userIds = Object.keys(currentUsers.val());
                        let userRefs = userIds.map((userId) => ref(props.db, `users/${userId}`));
                        setPlayerRefs(userRefs);
                        setPlayerCount(userIds.length);

                        // for each user, attach a listener for their card updates
                        for (let userRef of userRefs) {
                            let cardsRef = child(userRef, "cards");
                            onValue(cardsRef, (cards) => {
                                let newCards = cards.val();
                                if (newCards) {
                                    setPlayers((currentPlayers) => {
                                        let newPlayerData = [...currentPlayers];
                                        for (let i = 0; i < currentPlayers.length; i++) {
                                            if (newPlayerData[i].id === userRef.key) {
                                                // listen for knight cards played here 
                                                // so another listener doesn't need to be attached
                                                if (newPlayerData[i].cards[Development.knight] >
                                                    newCards[Development.knight]) {
                                                    newPlayerData[i].knightCardsPlayed++;
                                                }

                                                newPlayerData[i].cards = newCards;
                                                break;
                                            }
                                        }

                                        return newPlayerData;
                                    });
                                }
                            });
                        }
                    });

                off(gameStartRef);
            }
        });

        // listen for next turn
        onValue(child(props.roomRef, "turn"), (turn) => {
            // javascript moment™
            if (turn.val() || turn.val() === 0) {
                setTurn(turn.val());
            }
        });

        // listen for dice rolls
        onValue(child(props.roomRef, "roll"), (roll) => {
            let newRoll = roll.val();

            // roll is reset to 0 after turn end
            if (newRoll) {
                // highlight intersections when rolled
                document.querySelectorAll(`[data-roll-${newRoll}]`)
                    .forEach((intersection) => {
                        intersection.classList.add("intersection__point--rolled");

                        setTimeout(() => {
                            intersection.classList.remove("intersection__point--rolled");
                        }, 1200);
                    });

                get(child(props.userRef, "resourceRolls"))
                    .then((currentRolls) => {
                        // check this user's rolls
                        let resourceRolls: ResourceRoll[] = currentRolls.val() || [];
                        let resourcesProduced: CardHand = {};
                        for (let resourceRoll of resourceRolls) {
                            let resource = resourceRoll[newRoll];
                            if (resource && !isRobbed(resourceRoll.tile)) {
                                resourcesProduced[resource] = (resourcesProduced[resource] || 0) + 1;
                            }
                        }

                        // if resources are produced, update the user's cards
                        // each user listens to the card updates of the others
                        if (Object.keys(resourceRolls).length > 0) {
                            let newCards = Object.fromEntries(Object.entries(resourcesProduced)
                                .map(([resource, quantity]) => [resource, increment(quantity)]));

                            update(child(props.userRef, "cards"), newCards);
                        }
                    });
            }
        });

        // listen for notifications
        onValue(child(props.roomRef, "notification"), (newNotification) => {
            if (newNotification.val()) {
                setNotification(newNotification.val());
            }
        })

        // listen for robber position
        onValue(child(props.roomRef, "robber"), (newRobber) => {
            if (newRobber.val()) {
                setRobber(newRobber.val());
            }
        });

        // listen for development card purchase
        onValue(child(props.roomRef, "stock"), (newStock) => {
            if (newStock.val()) {
                stock.current = newStock.val();
            }
        });

        // listen for trade offers made to this user
        onValue(child(props.userRef, "tradeOffer"), (newOffer) => {
            if (newOffer.val()) {
                setTradeOffer(newOffer.val());
                setOngoingTrade(true);
            }
        });
    }, []);

    useEffect(() => {
        if (started) {
            let userPromises = playerRefs
                .map((playerRef) => get(playerRef));
            Promise.all(userPromises)
                .then((users) => {
                    let playerData: PlayerData[] = users.map((user) => {
                        let userData: UserData = user.val();
                        return {
                            id: userData.id,
                            index: userData.index,
                            name: userData.name,
                            cards: userData.cards || {},
                            settlements: userData.settlements,
                            cities: userData.cities,
                            roads: userData.roads,
                            knightCardsPlayed: userData.knightCardsPlayed,
                        };
                    });

                    // make sure players are sorted by index order
                    playerData.sort((player1, player2) => player1.index - player2.index);
                    setPlayers(playerData);
                });
        }

        setPlayerTurn(isPlayerTurn());
        setSetupTurn(isSetupTurn());

        // reset causes notification bubble to disappear
        setNotification(null);
        set(child(props.roomRef, "notification"), null);
    }, [turn]);

    useEffect(() => {
        // update current hand
        for (let player of players) {
            if (player.id === props.userRef.key) {
                cards.current = player.cards;
            }
        }
    }, [players]);

    useEffect(() => {
        // use robber movement hook to trigger card discard menu
        let count = countResourceCards(cards.current);
        let discard = count > 7 ? Math.floor(count / 2) : 0;

        setNeedToDiscard(discard);
        update(child(props.roomRef, "discarded"), { [props.userIndex]: discard === 0 });
    }, [robber]);

    function startGame() {
        set(child(props.roomRef, "started"), true);
        get(child(props.roomRef, "users"))
            .then((currentUsers) => {
                let count = Object.values(currentUsers.val()).length;
                setPlayerCount(count);

                // negative turn value indicates that the game is in the setup phase
                // each player gets 4 turns to place their 2 starter roads and 2 settlements
                let currentTurn = count * -4;
                set(child(props.roomRef, "turn"), currentTurn);

                setTurn(currentTurn);
                setStarted(true);
            });

        // set robber
        get(child(props.roomRef, "terrains"))
            .then((terrains) => {
                let tiles: Terrain[][] = terrains.val();
                for (let y = 0; y < tiles.length; y++) {
                    for (let x = 0; x < tiles[y].length; x++) {
                        if (tiles[y][x] === Terrain.desert) {
                            set(child(props.roomRef, "robber"), { x: x, y: y });
                            break;
                        }
                    }
                }
            });
    }

    function isPlayerTurn(playerIndex: number = props.userIndex): boolean {
        // offset the negative setup turns
        return (turn + playerCount * 4) % playerCount === playerIndex;
    }

    function isSetupTurn(): boolean {
        return turn < 0;
    }

    function rollDice() {
        if (isPlayerTurn() && !setupTurn) {
            let rollRef = child(props.roomRef, "roll");
            get(rollRef)
                .then((currentRoll) => {
                    // check that a value hasn't already been rolled for this turn
                    if (!currentRoll.val()) {
                        // add 2 die instead of randomInt(2, 13) for better distribution
                        let r1 = randomInt(1, 7);
                        let r2 = randomInt(1, 7);
                        let roll = r1 + r2;
                        set(child(props.roomRef, "roll"), roll);

                        // update dice notification
                        let diceIcons = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
                        let resultIcons = diceIcons[r1 - 1] + diceIcons[r2 - 1];
                        set(child(props.roomRef, "notification"), resultIcons);

                        // update chat
                        let message = `${props.userName} rolled a ${roll} ${resultIcons}`;
                        broadcastMessage(props.roomRef, messages, message);

                        // move robber
                        if (roll === 7) {
                            setCanPlaceRobber(true);
                        }
                    }
                })
        }
    }

    function isRobbed(tile: Coordinate): boolean {
        let robbed = false;

        // access latest state
        setRobber((robber) => {
            robbed = robber && tile.x === robber.x && tile.y === robber.y;
            return robber;
        });

        return robbed;
    }

    function placeRobber(x: number, y: number) {
        if (canPlaceRobber &&
            !(robber.x === x && robber.y === y)) {
            set(child(props.roomRef, "robber"), { x: x, y: y });

            // game cannot continue until all players have discarded
            setAllDiscarded(false);

            let discardRef = child(props.roomRef, "discarded");
            set(discardRef, Array(playerCount).fill(false));
            onValue(discardRef, (currentStatus) => {
                let discardedStatus: boolean[] = currentStatus.val();
                if (discardedStatus.every((discarded) => discarded)) {
                    // once all cards discarded, check if any players can be stolen from
                    let userPromises = playerRefs
                        .filter((playerRef) => playerRef.key !== props.userRef.key)
                        .map((playerRef) => get(playerRef));
                    Promise.all(userPromises)
                        .then((users) => {
                            users.forEach((user) => {
                                let userData: UserData = user.val();

                                // cannot steal if no cards
                                let canSteal = false;
                                if (countCards(userData.cards)) {
                                    for (let resourceRoll of userData.resourceRolls) {
                                        if (resourceRoll.tile.x === x &&
                                            resourceRoll.tile.y === y) {

                                            // update whether player can be robbed
                                            setPlayers((currentPlayers) => {
                                                let newPlayerData = [...currentPlayers];
                                                for (let i = 0; i < currentPlayers.length; i++) {
                                                    if (newPlayerData[i].id === userData.id) {
                                                        newPlayerData[i].canStealFrom = true;
                                                    }
                                                }

                                                return newPlayerData;
                                            });

                                            canSteal = true;
                                        }
                                    }
                                }

                                setNeedToSteal(canSteal);
                            });
                        });

                    setAllDiscarded(true);
                    off(discardRef);
                }
            });

            setCanPlaceRobber(false);
        }
    }

    function discardCards(cards: CardHand) {
        setNeedToDiscard((currentDiscard) => {
            // only proceed if the correct number is discarded
            if (countCards(cards) !== currentDiscard) {
                return currentDiscard;
            }

            let discardUpdate = Object.fromEntries(Object.entries(cards)
                .map(([card, quantity]) => [card, increment(quantity * -1)]));
            update(child(props.userRef, "cards"), discardUpdate);
            update(child(props.roomRef, "discarded"), { [props.userIndex]: true });

            return 0;
        });
    }

    function stealCards(targetId: string, cards: CardHand) {
        tradeResources(ref(props.db, `users/${targetId}`), { offering: cards, requesting: {} });
        tradeResources(props.userRef, { offering: {}, requesting: cards });
        setNeedToSteal(false);
    }

    function offerTrade(targetId: string, offering: CardHand,
        requesting: CardHand): Promise<string> {

        // check that the offer is valid
        if (countCards(offering) === 0 || countCards(requesting) === 0) {
            return Promise.reject("Incomplete offer");
        }

        // check for cards
        if (!hasRequiredCards(cards.current, offering)) {
            return Promise.reject("Insufficient resources");
        }

        let offer: TradeOffer = {
            fromId: props.userRef.key,
            fromName: props.userName,
            offering: offering,
            requesting: requesting,
        };

        let targetRef = ref(props.db, `users/${targetId}/tradeOffer`);
        set(targetRef, offer);
        onValue(targetRef, (offer) => {
            if (!offer.val()) {
                setOngoingTrade(false);
                off(targetRef);
            }
        });

        setOngoingTrade(true);
        return Promise.resolve("Offer sent!");
    }

    function processOffer(accept: boolean, offer?: TradeOffer) {
        if (accept && offer) {
            tradeResources(ref(props.db, `users/${offer.fromId}`), offer);
            tradeResources(props.userRef, { offering: offer.requesting, requesting: offer.offering });
        }

        set(child(props.userRef, "tradeOffer"), null);
        setTradeOffer(null);
        setOngoingTrade(false);
    }

    function buyCard(): Promise<string> {
        if (!cards.current[Resource.grain] ||
            !cards.current[Resource.ore] ||
            !cards.current[Resource.wool]) {

            return Promise.reject("Insufficient resources");
        }

        let availableCards: Development[] = Object.entries(stock.current)
            .map(([card, quantity]) => Array(quantity).fill(card))
            .flat();

        if (availableCards.length === 0) {
            return Promise.reject("No cards left");
        }

        let card = availableCards[randomInt(0, availableCards.length)];
        update(child(props.roomRef, "stock"), { [card]: increment(-1) });

        update(child(props.userRef, "cards"), {
            [Resource.grain]: increment(-1),
            [Resource.ore]: increment(-1),
            [Resource.wool]: increment(-1),
            [card]: increment(1),
        });

        return Promise.resolve(card);
    }

    function playKnightCard() {
        update(child(props.userRef, "cards"), { [Development.knight]: increment(-1) }); ``
        update(props.userRef, { "knightCardsPlayed": increment(1) });
        set(child(props.roomRef, "notification"), Development.knight);

        setCanPlaceRobber(true);
    }

    function playRoadBuildingCard() {
        // can build 2 roads
        quota.current[Infrastructure.road] = 2;

        update(child(props.userRef, "cards"), { [Development.roadBuilding]: increment(-1) });
        set(child(props.roomRef, "notification"), Development.roadBuilding);

        setNeedToBuildRoads(true);
    }

    function drawCards(cards: CardHand) {
        // draw 2 cards for year of plenty card
        if (countCards(cards) !== 2) {
            return;
        }

        let drawCardsUpdate = Object.fromEntries(Object.entries(cards)
            .map(([card, quantity]) => [card, increment(quantity)]));
        update(child(props.userRef, "cards"), drawCardsUpdate);
        setNeedToDrawCards(false);
    }

    function playYearOfPlentyCard() {
        update(child(props.userRef, "cards"), { [Development.yearOfPlenty]: increment(-1) });
        set(child(props.roomRef, "notification"), Development.yearOfPlenty);

        setNeedToDrawCards(true);
    }

    function stealAllResources(cards: CardHand) {
        // steal all resources of a certain type from all players for monopoly
        let resource = Object.entries(cards)
            .filter(([_, quantity]) => quantity != 0)[0][0];

        let total = 0;
        for (let player of players) {
            if (player.id === props.userRef.key) {
                continue;
            }

            let quantity = player.cards[resource as Resource];
            if (!quantity) {
                continue;
            }

            total += quantity;

            tradeResources(ref(props.db, `users/${player.id}`),
                { offering: { [resource]: quantity }, requesting: {} });
        }

        tradeResources(props.userRef,
            { offering: {}, requesting: { [resource]: total } });

        setNeedToMonopoly(false);
    }

    function playMonopolyCard() {
        update(child(props.userRef, "cards"), { [Development.monopoly]: increment(-1) });
        set(child(props.roomRef, "notification"), Development.monopoly);

        setNeedToMonopoly(true);
    }

    function endTurn(): void {
        if (isPlayerTurn()) {
            // reset roll so the listener can detect if the same number gets rolled
            set(child(props.roomRef, "roll"), 0);
            set(child(props.roomRef, "turn"), turn + 1);
            setTurn(turn + 1);
        }
    }

    function panelProps(playerId: string, playerIndex: number) {
        let thisPlayer = playerId === props.userRef.key
        let canBuyCard = Object.values(stock.current)
            .reduce((c1, c2) => c1 + c2, 0) !== 0;

        let cardActions: DevelopmentCardActions = {
            [Development.knight]: playKnightCard,
            [Development.roadBuilding]: playRoadBuildingCard,
            [Development.yearOfPlenty]: playYearOfPlentyCard,
            [Development.monopoly]: playMonopolyCard,
        };

        let thisPlayerActions = thisPlayer ? {
            rollDice: rollDice,
            buyCard: canBuyCard ? buyCard : null,
            cardActions: cardActions,
            endTurn: endTurn,
        } : {};

        return {
            userRef: props.userRef,
            thisPlayer: thisPlayer,
            playerTurn: isPlayerTurn(playerIndex),
            setupTurn: setupTurn,
            index: playerIndex,
            notification: notification,
            canPlaceRobber: canPlaceRobber,
            needToSteal: needToSteal,
            allDiscarded: allDiscarded,
            ongoingTrade: ongoingTrade,
            needToBuildRoads: needToBuildRoads,
            knightCardsPlayed: players[playerIndex].knightCardsPlayed,
            stealCards: stealCards,
            offerTrade: offerTrade,
            ...thisPlayerActions,
        };
    }

    function boardProps() {
        return {
            started: started,
            playerTurn: playerTurn,
            setupTurn: setupTurn,
            cards: cards,
            quota: quota,
            robber: robber,
            rolled: notification !== null,
            canPlaceRobber: canPlaceRobber,
            needToSteal: needToSteal,
            allDiscarded: allDiscarded,
            ongoingTrade: ongoingTrade,
            updateNeedToBuildRoads: setNeedToBuildRoads,
            endTurn: endTurn,
            placeRobber: canPlaceRobber ? placeRobber : null,
        };
    }

    function tradeMenuProps() {
        return {
            offer: tradeOffer,
            canAccept: hasRequiredCards(cards.current, tradeOffer.requesting),
            processOffer: processOffer,
        };
    }

    const StartButton = () => {
        return (
            <button className="game__start" onClick={startGame}>
                Start Game
            </button>
        );
    }

    const DiscardMenu = () => {
        return (
            <div className="overlay menu" style={{ display: "flex" }}>
                <Deck
                    cards={resourceCards(cards.current)}
                    drop={true}
                    selectQuota={needToDiscard}
                    actionLabel={`Discard ${needToDiscard}`}
                    deckAction={discardCards}
                />
            </div>
        );
    }

    const DrawCardsMenu = () => {
        let drawPile: CardHand = Object.fromEntries(Object.keys(Resource)
            .filter((card) => card !== Resource.none)
            .map((card) => [card, 2]));

        return (
            <div className="overlay menu" style={{ display: "flex" }}>
                <Deck
                    cards={drawPile}
                    drop={true}
                    selectQuota={2}
                    actionLabel={"Draw 2"}
                    deckAction={drawCards}
                />
            </div>
        );
    }

    const MonopolyCardMenu = () => {
        let resourceCards: CardHand = Object.fromEntries(Object.keys(Resource)
            .filter((card) => card !== Resource.none)
            .map((card) => [card, 1]));

        return (
            <div className="overlay menu" style={{ display: "flex" }}>
                <Deck
                    cards={resourceCards}
                    drop={true}
                    selectQuota={1}
                    actionLabel={"Choose 1 resource"}
                    deckAction={stealAllResources}
                />
            </div>
        );
    }

    return (
        <div className="game">
            {/* <div className="game__room-id">{`Room: ${props.roomRef.key}`}</div> */}
            {
                host && !started && <StartButton />
            }

            <div className="panels">
                {
                    players.map((playerData, index) => {
                        return <Panel
                            key={`panel-${playerData.id}`}
                            {...playerData}
                            {...panelProps(playerData.id, index)}
                        />
                    })
                }
            </div>

            {
                tradeOffer && <TradeMenu {...tradeMenuProps()} />
            }

            {
                needToDiscard > 0 && <DiscardMenu />
            }

            {
                needToDrawCards && <DrawCardsMenu />
            }

            {
                needToMonopoly && <MonopolyCardMenu />
            }

            <Board {...props} {...boardProps()} />

            <Chat {...props} messages={messages} setMessages={setMessages} />
        </div>
    );
}

export default Game;