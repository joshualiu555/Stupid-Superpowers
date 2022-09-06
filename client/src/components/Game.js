import React, {useState, useEffect} from "react"
import "./Game.css"
import Chat from "./Chat"
import Countdown from "react-countdown"
import initReactFastclick from "react-fastclick"
initReactFastclick();

function Game({socket, name, code, color, visibility}) {
    const [countdown, setCountdown] = useState(0)
    const [restart, setRestart] = useState(0)
    const [players, setPlayers] = useState([])
    const [round, setRound] = useState("lobby")
    const [situations, setSituations] = useState([])
    const [situationIndex, setSituationIndex] = useState(0)
    const [power, setPower] = useState(-1)
    const [submittedPower, setSubmittedPower] = useState(false)
    const [vote, setVote] = useState(-1)
    const [submittedVote, setSubmittedVote] = useState(false)
    const [scorers, setScorers] = useState([])
    const [winners, setWinners] = useState([])

    useEffect(() => {
        socket.emit("addPlayer", {code: code, name: name, id: socket.id})
        socket.on("addedPlayer", data => {
            setPlayers(data.players)
            if (data.players.length === 4) {
                setSituations(data.situations)
                restartCountdown(5)
                setRound("start")
            }
        })
        socket.on("removedPlayer", newPlayers => {
            setPlayers(newPlayers)
        })
        socket.on("submittedPower", newPlayers => {
            const notSelected = newPlayers.findIndex(player => player.power === -1)
            if (notSelected === -1) {
                restartCountdown(30)
                setRound("voting")
            }
            setPlayers(newPlayers)
        })
        socket.on("submittedVote", data => {
            setPlayers(data.players)
            if (data.scorers.length > 0) {
                restartCountdown(10)
                setRound("scoring")
                setScorers(data.scorers)
            }
        })
        socket.on("newRound", newPlayers => {
            setPlayers(newPlayers)
            setPower(-1)
            setSubmittedPower(false)
            setVote(-1)
            setSubmittedVote(false)
            setScorers([])
            setWinners([])
            setSituationIndex(prevState => prevState + 1)
            setRound("playing")
            restartCountdown(30)
        })
        socket.on("winner", data => {
            setRound("winning")
            setPlayers(data.players)
            setWinners(data.winners)
        })
        socket.on("disconnectGame", () => {
            setRound("disconnectGame")
        })
        return function cleanup() {
            socket.emit("disconnect")
            socket.off()
        }
    }, [])

    const restartCountdown = time => {
        setCountdown(Date.now() + time * 1000)
        setRestart(Math.floor(Math.random() * 90000) + 10000)
    }

    const findPlayer = () => {
        return players.findIndex(player => player.id === socket.id)
    }

    const findCards = () => {
        const index = findPlayer()
        return players[index].cards
    }

    const renderer = ({seconds}) => {
        return <p>{seconds}</p>
    }

    const startPlaying = () => {
        setRound("playing")
        restartCountdown(30)
    }

    const submitPower = () => {
        if (power !== -1)  {
            setSubmittedPower(true)
            socket.emit("submitPower", {code: code, id: socket.id, power: power})
        }
    }

    const submitVote = () => {
        if (vote !== -1) {
            setSubmittedVote(true)
            socket.emit("submitVote", {code: code, id: socket.id, vote: vote})
        }
    }

    const randomPower = () => {
        if (round === "playing" && !submittedPower) {
            setSubmittedPower(true)
            const randomIndex = Math.floor(Math.random() * 5)
            setPower(randomIndex)
            socket.emit("submitPower", {code: code, id: socket.id, power: randomIndex})
        }
    }

    const randomVote = () => {
        if (round === "voting" && !submittedVote) {
            setSubmittedVote(true)
            let randomIndex = Math.floor(Math.random() * players.length)
            while (players[randomIndex].id === socket.id) {
                randomIndex = Math.floor(Math.random() * players.length)
            }
            setVote(randomIndex)
            socket.emit("submitVote", {code: code, id: socket.id, vote: players[randomIndex].id})
        }
    }

    const resetRound = () => {
        socket.emit("resetRound", code)
    }

    if (round === "lobby") {
        return (
            <div className={"Lobby"}>
                <div className={"LobbyBox"}>
                    <h1>You: {name}</h1>
                    <h2 className={"LobbyUserCount"}>Waiting {players.length} / 4 players</h2>
                    <ul>
                        {players.map((player, index) => <li className={"LobbyPlayerList"} key={index}>{player.name}</li>)}
                    </ul>
                    <p>Game Info: Code: {code}, Color: {color}, Visibility: {visibility}</p>
                    <p>If you're on a phone or tablet, tilt it to the side</p>
                    <p>I was too lazy to code a disconnect button. Just refresh!</p>
                    <p className={"LobbyDisclaimer"}>Disclaimer: If you are playing a yellow game, you may be exposed to inappropriate content. Please leave if you don't want to continue</p>
                    <Chat socket={socket} code={code} color={color} name={name}/>
                </div>
            </div>
        )
    } else if (round === "start") {
        return (
            <div className={"Start"}>
                <h1 className={"StartMessage"}>Game Starting In...</h1>
                <div className={"StartCountdown"}>
                    <Countdown
                        date={countdown}
                        renderer={renderer}
                        onComplete={startPlaying}
                    />
                </div>
            </div>
        )
    } else if (round === "playing") {
        return (
            <div className={"Playing"}>
                <div className={"PlayingLayout"}>
                    <div className={"PlayingCountdown"}>
                        <Countdown
                            date={countdown}
                            key={restart}
                            renderer={renderer}
                            onComplete={randomPower}
                        />
                    </div>
                    <div className={"PlayingSituation"}>
                        <p>{situations[situationIndex]}</p>
                    </div>
                    <div className={"PlayingGameInfo"}>
                        <p>Game Info: Code: {code}</p>
                        <p>Color: {color}</p>
                        <p>Visibility: {visibility}</p>
                    </div>
                    <div className={"PlayingPlayerList"}>
                        <ul>
                            {players.map((player, index) => <li key={index}>{player.name} {player.name === name ? "(You)" : ""}: {player.score} {player.power !== -1 && "\u2713"}</li>)}
                        </ul>
                    </div>
                    <div className={"PlayingPowers"}>
                        <ul>
                            {findCards().map((card, index) =>
                                <li onClick={() => setPower(index)} style={{border: index === power ? "5px solid red" : ""}} key={index}>{card}</li>
                            )}
                        </ul>
                        <button onClick={submitPower}>Submit Power</button>
                    </div>
                    <div className={"PlayingChat"}>
                        <Chat socket={socket} code={code} color={color} name={name}/>
                    </div>
                </div>
            </div>
        )
    } else if (round === "voting") {
        return (
            <div className={"Voting"}>
                <div className={"VotingLayout"}>
                    <div className={"VotingCountdown"}>
                        <Countdown
                            date={countdown}
                            key={restart}
                            renderer={renderer}
                            onComplete={randomVote}
                        />
                    </div>
                    <div className={"VotingSituation"}>
                        <p>{situations[situationIndex]}</p>
                    </div>
                    <div className={"VotingGameInfo"}>
                        <p>Game Info: Code: {code}</p>
                        <p>Color: {color}</p>
                        <p>Visibility: {visibility}</p>
                    </div>
                    <div className={"VotingPlayerList"}>
                        <ul>
                            {players.map((player, index) => <li key={index}>{player.name} {player.name === name ? "(You)" : ""}: {player.score} {player.vote !== -1 && "\u2713"}</li>)}
                        </ul>
                    </div>
                    <div className={"VotingPowers"}>
                        <ul>
                            {players.map((player, index) =>
                                (player.id !== socket.id) ?
                                    <li onClick={() => setVote(player.id)} style={{border: player.id === vote ? "5px solid red" : ""}} key={index}>{player.cards[player.power]}</li> :
                                    undefined
                            )}
                        </ul>
                        <button onClick={submitVote}>Submit Vote</button>
                    </div>
                    <div className={"VotingChat"}>
                        <Chat socket={socket} code={code} color={color} name={name}/>
                    </div>
                </div>
            </div>
        )
    } else if (round === "scoring") {
        return (
            <div className={"Scoring"}>
                <div className={"ScoringBox"}>
                    <div className={"ScoringCountdown"}>
                        <Countdown
                            date={countdown}
                            key={restart}
                            renderer={renderer}
                            onComplete={resetRound}
                        />
                    </div>
                    <h2>Scorers</h2>
                    <ul>
                        {scorers.map((winner, index) => <li key={index}>{winner}</li>)}
                    </ul>
                    <h2>All Plays</h2>
                    <ul>
                        {players.map((player, index) => <li key={index}>{player.name}: {player.cards[player.power]}</li>)}
                    </ul>
                    <h2>Scoreboard</h2>
                    <ul>
                        {players.map((player, index) => <li key={index}>{player.name}: {player.score}</li>)}
                    </ul>
                    <Chat socket={socket} code={code} color={color} name={name}/>
                </div>
            </div>
        )
    } else if (round === "disconnectGame") {
        return (
            <div className={"Disconnecting"}>
                <div className={"DisconnectingBox"}>
                    <p>Too many players have disconnected. Please refresh to go back to the homepage</p>
                </div>
            </div>
        )
    } else if (round === "winning") {
        return (
            <div className={"Winning"}>
                <div className={"WinningBox"}>
                    <h2>All Plays</h2>
                    <ul>
                        {players.map((player, index) => <li key={index}>{player.name}: {player.cards[player.power]}</li>)}
                    </ul>
                    <h2>Scoreboard</h2>
                    <ul>
                        {players.map((player, index) => <li key={index}>{player.name}: {player.score}</li>)}
                    </ul>
                    <h2>The game has ended. Here are the winners!</h2>
                    <ul>
                        {winners.map((winner, index) => <li key={index}>{winner}</li>)}
                    </ul>
                    <Chat socket={socket} code={code} color={color} name={name}/>
                    <h1>Please refresh to go back to the homepage. </h1>
                </div>
            </div>
        )
    }
}

export default Game;
