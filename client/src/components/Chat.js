import React, {useState, useEffect} from "react"
import ScrollToBottom, {useScrollToBottom, useSticky} from "react-scroll-to-bottom"
import initReactFastclick from "react-fastclick"
initReactFastclick();
const filter = require("leo-profanity")

function Chat({socket, code, color, name}) {
    const scrollToBottom = useScrollToBottom();
    const [sticky] = useSticky();
    const [currentMessage, setCurrentMessage] = useState("")
    const [messageList, setMessageList] = useState([])

    useEffect(() => {
        socket.on("receiveMessage", (data) => {
            setMessageList(list => [...list, data])
        })
    }, [])

    const sendMessage = () => {
        if (currentMessage !== "") {
            let cleanCurrentMessage = currentMessage
            if (color === "green" && filter.check(cleanCurrentMessage)) {
                cleanCurrentMessage = filter.clean(cleanCurrentMessage)
            }
            const messageData = {
                code: code,
                name: name,
                message: cleanCurrentMessage,
            }
            setCurrentMessage("")
            socket.emit("sendMessage", messageData)
        }
    }

    return (
        <div className="ChatBox">
                <div className="MessageBox">
                    <ScrollToBottom className={"MessageList"}>
                        {messageList.map((messageContent, index) => {
                            return (
                                <p key={index}>{messageContent.name}: {messageContent.message}</p>
                            )
                        })}
                        {!sticky && <button onClick={scrollToBottom}>Click me to scroll to bottom</button>}
                    </ScrollToBottom>
                </div>
            <div className="YourMessage">
                <input
                    value={currentMessage}
                    placeholder="Type your message"
                    onChange={event => {setCurrentMessage(event.target.value)}}
                    onKeyPress={(event) => {
                        event.key === "Enter" && sendMessage();
                    }}
                />
                <button onClick={sendMessage}>Enter</button>
            </div>
        </div>
    )
}

export default Chat
