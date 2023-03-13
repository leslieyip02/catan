import { useState, useEffect } from "react";
import { Database, DatabaseReference } from "firebase/database";
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
    const [userName, setUserName] = useState<string>(props.userName);

    return (
        <div>
            {/* <div>{`Room: ${roomRef.key}`}</div> */}
            <Board />

            <Chat db={props.db} userRef={userRef} roomRef={roomRef} userName={userName} />
        </div>
    );
}

export default Game;