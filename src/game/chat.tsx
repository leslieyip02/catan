import { useState, useEffect } from "react";
import { get, update, child, Database, DatabaseReference, onValue } from "firebase/database";

interface ChatProps {
    db: Database;
    userRef: DatabaseReference;
    roomRef: DatabaseReference;
    userName: string;
};

function Chat(props: ChatProps) {
    const [userRef, setUserRef] = useState<DatabaseReference>(props.userRef);
    const [roomRef, setRoomRef] = useState<DatabaseReference>(props.roomRef);
    const [currentMessage, setCurrentMessage] = useState<string>("");
    const [messages, setMessages] = useState<string[]>([]);
    const [open, setOpen] = useState<boolean>(false);

    useEffect(() => {
        let messageRef = child(roomRef, "messages");

        // fetch existing messages
        get(messageRef)
            .then((currentMessages) => {
                // default to empty array
                setMessages(currentMessages.val() || []);
            });

        // updates messages every time a new one is added
        onValue(messageRef, (newMessages) => {
            setMessages(newMessages.val() || messages || []);

            // scroll to bottom
            let chatLog = document.querySelector(".chat__log");
            chatLog.scrollTo(0, chatLog.scrollHeight);
        });
    }, []);

    function sendMessage() {
        let currentMessages = [...messages, `${props.userName}: ${currentMessage}`];
        update(roomRef, { messages: currentMessages });

        // reset input text
        setCurrentMessage("");
        let input: HTMLInputElement = document.querySelector(".chat__input>input");
        input.value = "";
    }

    function toggleHide() {
        let chat: HTMLDivElement = document.querySelector(".chat");
        chat.style.display = open ? "none" : "flex";
        setOpen(!open);
    }

    return (
        <div className="sidebar">
            <button className="chat__close" onClick={toggleHide}>
                <i className="fa-regular fa-comment"></i>
            </button>
            <div className="chat">
                <div className="chat__log">
                    {
                        messages.map((message, i) => <div key={i}>{message}</div>)
                    }
                </div>

                <form className="chat__input" onSubmit={(e) => e.preventDefault()}>
                    <input
                        placeholder="Type a message..."
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                    />
                    <button onClick={sendMessage}>Send</button>
                </form>
            </div>
        </div>
    );
}

export default Chat;