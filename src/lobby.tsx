import { useState, useEffect } from "react";
import { ref, get, set, update, push, child, Database, DatabaseReference, onDisconnect } from "firebase/database";
import { signInAnonymously, onAuthStateChanged, Auth } from "firebase/auth";
import { UserProps, userColors, defaultUserQuotas } from "./user";

interface LobbyProps {
    auth: Auth;
    db: Database;
    updateRefs: (newUserRef: DatabaseReference, newRoomRef: DatabaseReference) => void;
    updateUserName: (newUserName: string) => void;
};

function Lobby(props: LobbyProps) {
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
                let newUser: UserProps = { id: uid, };

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
        set(newRoomRef, { host: userId, started: false });
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
            get(child(targetRoomRef, "started"))
                .then((started) => {
                    // cannot join ongoing games
                    if (!started.val()) {
                        let roomUsersRef = child(targetRoomRef, "users");
                        get(roomUsersRef)
                            // currentUsers is a dictionary of user IDs
                            .then((currentUsers) => {
                                let index = Object.values(currentUsers.val() || {}).length;
                                update(roomUsersRef, { [userId]: true });

                                let updatedUser: UserProps = {
                                    id: userId,
                                    index: index,
                                    name: userName || "Anonymous",
                                    color: userColors[index],
                                    ...defaultUserQuotas,
                                };

                                set(userRef, updatedUser);

                                // update parent app component
                                props.updateRefs(userRef, targetRoomRef);
                                props.updateUserName(updatedUser.name);
                            });
                    }
                });
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