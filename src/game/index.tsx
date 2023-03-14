import { useState, useEffect } from "react";
import { get, set, child, onValue, Database, DatabaseReference, off } from "firebase/database";
import Board from "./board";
import Chat from "./chat";

interface GameProps {
    db: Database;
    userRef: DatabaseReference;
    roomRef: DatabaseReference;
    userName: string;
};

function Game(props: GameProps) {
    const [host, setHost] = useState<boolean>(false);
    const [started, setStarted] = useState<boolean>(false);
    const [playerCount, setPlayerCount] = useState<number>();

    useEffect(() => {
        // check if this user is the host
        get(child(props.roomRef, "host"))
            .then((host) => setHost(host.val() === props.userRef.key));

        // listen for game start
        let gameStartRef = child(props.roomRef, "started");
        onValue(gameStartRef, (gameStart) => {
            if (gameStart.val()) {
                setStarted(true);

                get(child(props.roomRef, "users"))
                    .then((userIds) => setPlayerCount(Object.values(userIds.val()).length));

                off(gameStartRef);
            }
        });
    }, []);

    function startGame() {
        set(child(props.roomRef, "started"), true);
        set(child(props.roomRef, "turn"), 0);
        setStarted(true);
    }

    function endTurn() {

    }

    return (
        <div>
            {/* <div>{`Room: ${props.roomRef.key}`}</div> */}
            {host && !started && <button onClick={startGame}>Start Game</button>}
            <Board
                {...props}
                started={started}
            />
            <Chat {...props} />
        </div>
    );
}

export default Game;