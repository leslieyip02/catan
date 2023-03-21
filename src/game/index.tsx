import { useState, useEffect, useRef } from 'react';
import { ref, get, set, child, onValue, Database, DatabaseReference, off, increment, update } from "firebase/database";
import Board from "./board";
import Chat from "./chat";
import Panel from "./panel";
import { UserData, PlayerData } from "../user";
import { randomInt, diceIcons } from './random';
import { ResourceRoll } from './card/resource';
import { CardHand, countCards } from './card/hand';
import { broadcastMessage } from './chat';
import { Terrain } from './board/tile';
import { Coordinate } from './board';
import { defaultInfrastructure, InfrastructureQuota } from './board/infrastructure';
import { hasRequiredCards, TradeOffer } from './trade';
import Menu from './trade/domestic';

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
    const [dice, setDice] = useState<string>();
    const [messages, setMessages] = useState<string[]>([]);
    const [robber, setRobber] = useState<Coordinate>();
    const [canPlaceRobber, setCanPlaceRobber] = useState<boolean>();
    const [tradeOffer, setTradeOffer] = useState<TradeOffer>();
    const [ongoingTrade, setOngoingTrade] = useState<boolean>(false);

    // keep separate reference
    const cards = useRef<CardHand>({});
    const quota = useRef<InfrastructureQuota>(defaultInfrastructure);

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
                        let userRefs = userIds.map((userId) => ref(props.db, `users/${userId}`))
                        setPlayerRefs(userRefs);
                        setPlayerCount(userIds.length)

                        // for each user, attach a listener for their card updates
                        for (let userRef of userRefs) {
                            let cardsRef = child(userRef, "cards");
                            onValue(cardsRef, (cards) => {
                                let newCards = cards.val();
                                if (newCards) {
                                    setPlayers((currentPlayers) => {
                                        let newPlayerStats = [...currentPlayers];
                                        for (let i = 0; i < currentPlayers.length; i++) {
                                            if (newPlayerStats[i].id === userRef.key) {
                                                newPlayerStats[i].cards = newCards;
                                                break;
                                            }
                                        }

                                        return newPlayerStats;
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

        onValue(child(props.roomRef, "dice"), (newDice) => {
            if (newDice.val()) {
                setDice(newDice.val());
            }
        })

        // listen for robber position
        onValue(child(props.roomRef, "robber"), (newRobber) => {
            if (newRobber.val()) {
                setRobber(newRobber.val());
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
                    let playerStats = users.map((user) => {
                        let userData: UserData = user.val();
                        let playerStat: PlayerData = {
                            id: userData.id,
                            index: userData.index,
                            name: userData.name,
                            cards: userData.cards || {},
                            settlements: userData.settlements,
                            cities: userData.cities,
                            roads: userData.roads,
                        }

                        return playerStat;
                    });

                    // make sure players are sorted by index order
                    playerStats.sort((player1, player2) => player1.index - player2.index);
                    setPlayers(playerStats);
                });
        }

        setPlayerTurn(isPlayerTurn());
        setSetupTurn(isSetupTurn());

        // reset causes dice roll bubble to disappear
        setDice(null);
        set(child(props.roomRef, "dice"), null);
    }, [turn]);

    useEffect(() => {
        // update current hand
        for (let player of players) {
            if (player.id === props.userRef.key) {
                cards.current = player.cards;
            }
        }
    }, [players]);

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

                        // update dice
                        let icons = diceIcons[r1 - 1] + diceIcons[r2 - 1];
                        set(child(props.roomRef, "dice"), icons);

                        // update chat
                        let message = `${props.userName} rolled a ${roll} ${icons}`;
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



            setCanPlaceRobber(false);
        }
    }

    function endTurn() {
        if (isPlayerTurn()) {
            // reset roll so the listener can detect if the same number gets rolled
            set(child(props.roomRef, "roll"), 0);
            set(child(props.roomRef, "turn"), turn + 1);
            setTurn(turn + 1);
        }
    }

    function offerTrade(targetId: string, offering: CardHand,
        requesting: CardHand): Promise<string> {

        // check that the offer is valid
        if (countCards(offering) === 0 || countCards(requesting) === 0) {
            return Promise.reject("Incomplete offer");
        }

        // check for cards
        if (!hasRequiredCards(cards.current, offering)) {
            return Promise.reject("Insufficient resources");;
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
            let transfer: Record<string, number> = {};

            for (let [card, quantity] of Object.entries(offer.offering)) {
                transfer[card] = (transfer[card] || 0) - quantity;
            }

            for (let [card, quantity] of Object.entries(offer.requesting)) {
                transfer[card] = (transfer[card] || 0) + quantity;
            }

            let offerUpdate = Object.fromEntries(Object.entries(transfer)
                .map(([card, quantity]) => [card, increment(quantity)]));
            update(ref(props.db, `users/${offer.fromId}/cards`), offerUpdate);

            let requestUpdate = Object.fromEntries(Object.entries(transfer)
                .map(([card, quantity]) => [card, increment(quantity * -1)]));
            update(child(props.userRef, "cards"), requestUpdate);
        }

        set(child(props.userRef, "tradeOffer"), null);
        setTradeOffer(null);
        setOngoingTrade(false);
    }

    function panelProps(playerId: string, playerIndex: number) {
        return {
            thisPlayer: playerId === props.userRef.key,
            playerTurn: isPlayerTurn(playerIndex),
            setupTurn: setupTurn,
            index: playerIndex,
            dice: dice,
            canPlaceRobber: canPlaceRobber,
            ongoingTrade: ongoingTrade,
            rollDice: rollDice,
            offerTrade: offerTrade,
            endTurn: endTurn,
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
            endTurn: endTurn,
            placeRobber: canPlaceRobber ? placeRobber : null,
        };
    }

    function menuProps() {
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
                tradeOffer && <Menu {...menuProps()} />
            }

            <Board {...props} {...boardProps()} />

            <Chat {...props} messages={messages} setMessages={setMessages} />
        </div>
    );
}

export default Game;