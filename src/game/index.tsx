import { useState, useEffect } from "react";
import { get, set, child, Database, DatabaseReference } from "firebase/database";
import Board from "./board";
import Chat from "./chat";

interface GameProps {
    db: Database;
    userRef: DatabaseReference;
    roomRef: DatabaseReference;
    userName: string;
};

function Game(props: GameProps) {
    const [userRef, setUserRef] = useState<DatabaseReference>(props.userRef);
    const [roomRef, setRoomRef] = useState<DatabaseReference>(props.roomRef);
    const [host, setHost] = useState<boolean>(false);
    const [started, setStarted] = useState<boolean>(false);

    // check if this user is the host
    useEffect(() => {
        get(child(roomRef, "host"))
            .then((host) => setHost(host.val() === userRef.key));
    }, []);

    function startGame() {
        set(child(roomRef, "started"), true);
        set(child(roomRef, "turn"), 0);
        setStarted(true);
    }

    return (
        <div>
            {/* <div>{`Room: ${roomRef.key}`}</div> */}
            {
                host && !started && <button onClick={startGame}>Start Game</button>
            }
            <Board {...props} />
            <Chat {...props} />
        </div>
    );
}

export default Game;