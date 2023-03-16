import { useState, useEffect } from "react";
import { get, set, child, onValue, Database, DatabaseReference, off } from "firebase/database";
import Board from "./board";
import Chat from "./chat";

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
                get(child(props.roomRef, "users"))
                    .then((userIds) => setPlayerCount(Object.values(userIds.val()).length));

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
        setPlayerTurn(isPlayerTurn());
        setSetupTurn(isSetupTurn());
    }, [turn]);

    function startGame() {
        set(child(props.roomRef, "started"), true);
        get(child(props.roomRef, "users"))
            .then((userIds) => {
                let count = Object.values(userIds.val()).length;
                setPlayerCount(count);

                // negative turn value indicates that the game is in the setup phase
                // each player gets 4 turns to place their 2 starter roads and 2 settlements
                let currentTurn = count * -4;
                set(child(props.roomRef, "turn"), currentTurn);
                setTurn(currentTurn);
                setStarted(true);
            });

    }

    function isPlayerTurn(): boolean {
        return (turn + playerCount * 4) % playerCount === props.userIndex;
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
        <div>
            {/* <div>{`Room: ${props.roomRef.key}`}</div> */}
            {host && !started && <button onClick={startGame}>Start Game</button>}
            {started && <button onClick={endTurn}>End Turn</button>}
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