import { useState, useEffect } from "react";
import { ref, get, set, update, push, child, Database, DatabaseReference, onDisconnect } from "firebase/database";
import { signInAnonymously, onAuthStateChanged, Auth } from "firebase/auth";
import { UserData, defaultUserQuotas } from "./game/user";
import { defaultTerrains, defaultRolls } from "./game/board/default";
import { defaultDevelopmentCards } from "./game/card/default";

interface LobbyProps {
    auth: Auth;
    db: Database;
    updateUserRef: (newUserRef: DatabaseReference) => void;
    updateRoomRef: (newRoomRef: DatabaseReference) => void;
    updateUserIndex: (newUserIndex: number) => void;
    updateUserName: (newUserName: string) => void;
};

const Lobby = (props: LobbyProps) => {
    const [userId, setUserId] = useState<string>();
    const [userRef, setUserRef] = useState<DatabaseReference>();
    const [userName, setUserName] = useState<string>("");
    const [roomId, setRoomId] = useState<string>("");

    const [userNameTooltipText, setUserNameTooltipText] = useState<string>();
    const [clipboardTooltipText, setClipboardTooltipText] = useState<string>();

    // sign in on page load and get user ref
    useEffect(() => {
        onAuthStateChanged(props.auth, (user) => {
            if (user) {
                // values are not available until after inital render
                let uid = user.uid;
                let newUserRef = ref(props.db, `users/${uid}`);

                setUserId(uid);
                setUserRef(newUserRef);
                set(newUserRef, { id: uid });

                // handle disconnection
                onDisconnect(newUserRef).remove();
            }
        });

        signInAnonymously(props.auth);
    }, []);

    useEffect(() => {
        if (userNameTooltipText) {
            let userNameTooltip: HTMLSpanElement = document
                .querySelector("#user-name-tooltip");
            userNameTooltip.style.visibility = "visible";

            setTimeout(() => {
                userNameTooltip.style.visibility = "hidden";
                setUserNameTooltipText("");
            }, 2000);
        }
    }, [userNameTooltipText]);

    useEffect(() => {
        if (clipboardTooltipText) {
            let clipboardTooltip: HTMLSpanElement = document
                .querySelector("#clipboard-tooltip");
            clipboardTooltip.style.visibility = "visible";

            setTimeout(() => {
                clipboardTooltip.style.visibility = "hidden";
                setClipboardTooltipText("");
            }, 2000);
        }
    }, [clipboardTooltipText]);

    function createRoom() {
        // create new ref for the room
        let newRoomRef = push(ref(props.db, "rooms"));
        set(newRoomRef, {
            host: userId,
            started: false,
            terrains: defaultTerrains,
            rolls: defaultRolls,
            stock: defaultDevelopmentCards,
        });

        setRoomId(newRoomRef.key);

        // delete room when host leaves
        onDisconnect(newRoomRef).remove();

        // update form input
        let input: HTMLInputElement = document.querySelector(".form__input>input");
        input.value = newRoomRef.key;
    };

    function joinRoom() {
        // cannot join a non-existent room
        if (!roomId || roomId.length === 0) {
            setUserNameTooltipText("Nothing to join")
            return;
        }

        if (userName.length > 10) {
            setUserNameTooltipText("Username should be ≤ 10 characters")
            return;
        }

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
                            let userIds = currentUsers.val() || {};

                            // check if user is already in a room
                            if (userId in userIds) {
                                return;
                            }

                            // cannot exceed 4 players
                            if (Object.values(userIds).length === 4) {
                                return;
                            }

                            let index = Object.values(userIds).length;
                            update(roomUsersRef, { [userId]: true });

                            let updatedUser: UserData = {
                                id: userId,
                                roomId: roomId,
                                index: index,
                                name: userName || "Anonymous",
                                cards: {},
                                resourceRolls: [],
                                knightCardsPlayed: 0,
                                ...defaultUserQuotas,
                            };

                            set(userRef, updatedUser);

                            // update parent app component
                            props.updateUserRef(userRef);
                            props.updateRoomRef(targetRoomRef);
                            props.updateUserIndex(index);
                            props.updateUserName(updatedUser.name);
                        });
                }
            })
            .catch(() => {
                setUserNameTooltipText("Unable to join");
                return;
            });
    };

    function copyToClipboard() {
        if (roomId.length === 0) {
            setClipboardTooltipText("Nothing to copy");
            return;
        }

        navigator.clipboard.writeText(roomId);
        setClipboardTooltipText("Copied!");
    }

    return (
        <div>
            <form className="form" onSubmit={(e) => e.preventDefault()}>
                <div className="form__input">
                    <input
                        placeholder="Name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                    />
                    <i className="fa-solid fa-user">
                        <span
                            id="user-name-tooltip"
                            className="tooltip"
                            style={{ visibility: "hidden" }}
                        >
                            {userNameTooltipText}
                        </span>
                    </i>
                </div>
                <div className="form__input">
                    <input
                        placeholder="Room ID"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                    />
                    <i
                        className="fa-solid fa-paste"
                        onClick={copyToClipboard}
                    >
                        <span
                            id="clipboard-tooltip"
                            className="tooltip"
                            style={{ visibility: "hidden" }}
                        >
                            {clipboardTooltipText}
                        </span>
                    </i>
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