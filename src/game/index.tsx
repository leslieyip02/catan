import { useState, useEffect, useRef } from 'react';
import { ref, get, set, child, onValue, Database, DatabaseReference, off, DataSnapshot } from "firebase/database";
import Board from "./board";
import Chat from "./chat";
import Panel, { StatCardData } from "./panel";
import { UserData } from "../user";

interface GameProps {
    db: Database;
    userRef: DatabaseReference;
    roomRef: DatabaseReference;
    userIndex: number;
    userName: string;
};

function Game(props: GameProps) {
    const [host, setHost] = useState<boolean>(false);
    const [playerCount, setPlayerCount] = useState<number>();
    const [players, setPlayers] = useState<StatCardData[]>([]);
    const [started, setStarted] = useState<boolean>(false);
    const [turn, setTurn] = useState<number>(0);
    const [playerTurn, setPlayerTurn] = useState<boolean>(false);
    const [setupTurn, setSetupTurn] = useState<boolean>(false);

    useEffect(() => {
        // check if this user is the host
        get(child(props.roomRef, "host"))
            .then((host) => setHost(host.val() === props.userRef.key));

        // listen for game start
        let gameStartRef = child(props.roomRef, "started");
        onValue(gameStartRef, (gameStart) => {
            if (gameStart.val()) {
                setStarted(true);
                off(gameStartRef);
            }
        });

        onValue(child(props.roomRef, "turn"), (turn) => {
            if (turn.val()) {
                setTurn(turn.val());
            }
        });
    }, []);

    useEffect(() => {
        if (started) {
            get(child(props.roomRef, "users"))
                .then(async (currentUsers) => {
                    let userIds = currentUsers.val() || {};
                    setPlayerCount(Object.values(userIds).length);

                    let userPromises = Object.keys(userIds)
                        .map((userId) => get(ref(props.db, `users/${userId}`)));
                    Promise.all(userPromises)
                        .then((users) => {
                            let playerStats = users.map((user) => {
                                let userData: UserData = user.val();
                                let playerStat: StatCardData = {
                                    id: userData.id,
                                    name: userData.name,
                                    cards: userData.cards,
                                    settlements: userData.settlements,
                                    cities: userData.cities,
                                    roads: userData.roads,
                                }

                                return playerStat;
                            });

                            setPlayers(playerStats);
                        });
                });
        }

        setPlayerTurn(isPlayerTurn());
        setSetupTurn(isSetupTurn());
    }, [turn]);

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

    }

    function isPlayerTurn(playerIndex: number = props.userIndex): boolean {
        // offset the negative setup turns
        return (turn + playerCount * 4) % playerCount === playerIndex;
    }

    function isSetupTurn(): boolean {
        return turn < 0;
    }

    function endTurn() {
        if (isPlayerTurn()) {
            set(child(props.roomRef, "turn"), turn + 1);
            setTurn(turn + 1);
        }
    }

    return (
        <div className="game">
            {/* <div className="game__room-id">{`Room: ${props.roomRef.key}`}</div> */}
            {/* temporary buttons */}
            {host && !started &&
                <button
                    className="game__start"
                    onClick={startGame}
                >
                    Start Game
                </button>
            }
            {/* {started && !setupTurn && <button onClick={endTurn}>End Turn</button>} */}

            <div className="panels">
                {
                    players.map((playerData, index) => {
                        return <Panel
                            key={`panel-${playerData.id}`}
                            thisPlayer={playerData.id === props.userRef.key}
                            playerTurn={isPlayerTurn(index)}
                            index={index}
                            {...playerData}
                        />
                    })
                }
            </div>

            <Board
                {...props}
                started={started}
                playerTurn={playerTurn}
                setupTurn={setupTurn}
                endTurn={endTurn}
            />
            <Chat {...props} />
        </div>
    );
}

export default Game;