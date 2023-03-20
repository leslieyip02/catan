import { useState, useEffect } from "react";
import { get, update, child, Database, DatabaseReference, onValue } from "firebase/database";

interface ChatProps {
    db: Database;
    userRef: DatabaseReference;
    roomRef: DatabaseReference;
    userName: string;
    messages: string[];
    setMessages: (messages: string[]) => void;
};

function broadcastMessage(roomRef: DatabaseReference, currentMessages: string[], newMessage: string) {
    let newMessages = [...currentMessages, newMessage];
    update(roomRef, { messages: newMessages });
}

const Chat = (props: ChatProps) => {
    const [currentMessage, setCurrentMessage] = useState<string>("");
    const [open, setOpen] = useState<boolean>(false);

    useEffect(() => {
        let messageRef = child(props.roomRef, "messages");

        // fetch existing messages
        get(messageRef)
            .then((currentMessages) => {
                // default to empty array
                props.setMessages(currentMessages.val() || []);
            });

        // updates messages every time a new one is added
        onValue(messageRef, (newMessages) => {
            props.setMessages(newMessages.val() || props.messages || []);

            // scroll to bottom
            let chatLog = document.querySelector(".chat__log");
            chatLog.scrollTo(0, chatLog.scrollHeight);
        });
    }, []);

    function sendMessage() {
        let message = `${props.userName}: ${currentMessage}`;
        broadcastMessage(props.roomRef, props.messages, message);

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
                        props.messages.map((message, i) => <div key={i}>{message}</div>)
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
export { broadcastMessage };