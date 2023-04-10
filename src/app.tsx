import { useState } from "react";
import { Database, DatabaseReference } from "firebase/database";
import { Auth } from "firebase/auth";
import Lobby from "./lobby";
import Game from "./game";

interface AppProps {
    auth: Auth;
    db: Database;
};

const App = (props: AppProps) => {
    const [userRef, setUserRef] = useState<DatabaseReference>();
    const [roomRef, setRoomRef] = useState<DatabaseReference>();
    const [userIndex, setUserIndex] = useState<number>();
    const [userName, setUserName] = useState<string>();

    return (
        <div className="app">
            {
                !roomRef
                    ? <Lobby
                        auth={props.auth}
                        db={props.db}
                        updateUserRef={setUserRef}
                        updateRoomRef={setRoomRef}
                        updateUserIndex={setUserIndex}
                        updateUserName={setUserName}
                    />
                    : <Game
                        db={props.db}
                        userRef={userRef}
                        roomRef={roomRef}
                        userIndex={userIndex}
                        userName={userName}
                    />
            }
            <a 
                href="https://www.catan.com/sites/default/files/2021-06/catan_base_rules_2020_200707.pdf"
                target="blank"
                className="rules"
            >
                <i className="fa-solid fa-book">
                    <span className="tooltip">Rules</span>
                </i>
            </a>
        </div>
    );
}

export default App;