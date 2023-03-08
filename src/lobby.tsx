import { useState, useEffect } from "react";
import { ref, set, update, push, Database, DatabaseReference, onDisconnect } from 'firebase/database';
import { signInAnonymously, onAuthStateChanged, Auth } from "firebase/auth";

interface lobbyProps {
    auth: Auth;
    db: Database;
    updateRefs: (newUserRef: DatabaseReference, newRoomRef: DatabaseReference) => void;
    updateUserName: (newUserName: string) => void;
};

interface userProps {
    id: string;
    name: string;
};

function Lobby(props: lobbyProps) {
    const [userId, setUserId] = useState<string>();
    const [userRef, setUserRef] = useState<DatabaseReference>();
    const [userName, setUserName] = useState<string>("");
    const [roomId, setRoomId] = useState<string>("");

    // sign in on page load and get user ref
    useEffect(() => {
        onAuthStateChanged(props.auth, (user) => {
            if (user) {
                // values are not available until after inital render
                let uid = user.uid;
                let newUserRef = ref(props.db, `users/${uid}`);
                let newUser: userProps = {
                    id: uid,
                    name: userName,
                };

                setUserId(uid);
                setUserRef(newUserRef);
                set(newUserRef, newUser);

                // handle disconnection
                onDisconnect(newUserRef).remove();
            }
        });

        signInAnonymously(props.auth);
    }, []);

    function createRoom() {
        // create new ref for the room
        let newRoomRef = push(ref(props.db, "rooms"));
        setRoomId(newRoomRef.key);

        // delete room when host leaves
        onDisconnect(newRoomRef).remove();

        // update form input
        let input: HTMLInputElement = document.querySelector(".form__input>input");
        input.value = newRoomRef.key;
    };

    function joinRoom() {
        // cannot join a non-existent room
        if (roomId) {
            // append user
            let targetRoomRef = ref(props.db, `rooms/${roomId}`);
            update(targetRoomRef, { [userId]: true });
    
            let updatedUser: userProps = {
                id: userId,
                name: userName || "Anonymous",
            };
    
            set(userRef, updatedUser);
    
            // update parent app component
            props.updateRefs(userRef, targetRoomRef);
            props.updateUserName(updatedUser.name);
        }
    };

    return (
        <div>
            <form className="form" onSubmit={(e) => e.preventDefault()}>
                <div className="form__input">
                    <input
                        placeholder="Name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                    />
                    <i className="fa-solid fa-user" />
                </div>
                <div className="form__input">
                    <input
                        placeholder="Room ID"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                    />
                    <i
                        className="fa-solid fa-paste"
                        onClick={() => navigator.clipboard.writeText(roomId)}
                    />
                </div>
                <div className="form__buttons">
                    <button onClick={createRoom}>Create Room</button>
                    <button onClick={joinRoom}>Join Room</button>
                </div>
            </form>
        </div>
    );
};

export default Lobby;