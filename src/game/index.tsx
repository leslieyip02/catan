import { useState, useEffect, useRef } from 'react';
import { ref, get, set, child, onValue, Database, DatabaseReference, off, DataSnapshot } from "firebase/database";
import Board from "./board";
import Chat from "./chat";
import Panel, { PanelData } from "./panel";
import { UserData } from "../user";
import { randomInt, dice } from './random';
import { ResourceRoll } from './board/resource';
import { CardHand } from './card';
import { broadcastMessage } from './chat';
import { Terrain } from './board/tile';
import { Coordinate } from './board';

interface GameProps {
    db: Database;
    userRef: DatabaseReference;
    roomRef: DatabaseReference;
    userIndex: number;
    userName: string;
};

function Game(props: GameProps) {
    const [host, setHost] = useState<boolean>(false);
    const [players, setPlayers] = useState<PanelData[]>([]);
    const [playerRefs, setPlayerRefs] = useState<DatabaseReference[]>([]);
    const [playerCount, setPlayerCount] = useState<number>();
    const [started, setStarted] = useState<boolean>(false);
    const [turn, setTurn] = useState<number>(0);
    const [playerTurn, setPlayerTurn] = useState<boolean>(false);
    const [setupTurn, setSetupTurn] = useState<boolean>(false);
    const [messages, setMessages] = useState<string[]>([]);
    const [robber, setRobber] = useState<Coordinate>();
    const [canPlaceRobber, setCanPlaceRobber] = useState<boolean>();

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

        onValue(child(props.roomRef, "turn"), (turn) => {
            // javascript moment™
            if (turn.val() || turn.val() === 0) {
                setTurn(turn.val());
            }
        });

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
                            let cardsRef = child(props.userRef, "cards");
                            get(cardsRef)
                                .then((currentCards) => {
                                    let newCards = currentCards.val() || {};
                                    for (let [resourceProduced, quantity] of Object.entries(resourcesProduced)) {
                                        newCards[resourceProduced] = (newCards[resourceProduced] || 0) + quantity;
                                    }

                                    set(cardsRef, newCards);
                                });
                        }
                    });
            }
        });

        // listen for robber position
        onValue(child(props.roomRef, "robber"), (newRobber) => {
            if (newRobber.val()) {
                setRobber(() => newRobber.val());
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
                        let playerStat: PanelData = {
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
    }, [turn]);

    useEffect(() => {
        setCanPlaceRobber(false);
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
        if (isPlayerTurn()) {
            let rollRef = child(props.roomRef, "roll");
            get(rollRef)
                .then((currentRoll) => {
                    // check that a value hasn't already been rolled for this turn
                    if (!currentRoll.val()) {
                        // add 2 dice instead of randomInt(1, 12) for better distribution
                        let d1 = randomInt(1, 6);
                        let d2 = randomInt(1, 6);
                        let roll = d1 + d2;
                        set(child(props.roomRef, "roll"), roll);

                        // update chat
                        let message = `${props.userName} rolled a ${roll} ${dice[d1 - 1]}${dice[d2 - 1]}`;
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

    return (
        <div className="game">
            {/* <div className="game__room-id">{`Room: ${props.roomRef.key}`}</div> */}
            {
                host && !started && <button
                    className="game__start"
                    onClick={startGame}
                >
                    Start Game
                </button>
            }

            <div className="panels">
                {
                    players.map((playerData, index) => {
                        return <Panel
                            key={`panel-${playerData.id}`}
                            thisPlayer={playerData.id === props.userRef.key}
                            playerTurn={isPlayerTurn(index)}
                            index={index}
                            {...playerData}
                            rollDice={rollDice}
                            endTurn={endTurn}
                        />
                    })
                }
            </div>

            <Board
                {...props}
                started={started}
                playerTurn={playerTurn}
                setupTurn={setupTurn}
                robber={robber}
                endTurn={endTurn}
                placeRobber={canPlaceRobber ? placeRobber : null}
            />
            <Chat
                {...props}
                messages={messages}
                setMessages={setMessages}
            />
        </div>
    );
}

export default Game;