const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server, {
    cors: {
        origin: "http://localhost:3000",
    }
});

const {findPublicGame, createGame, checkGameAvailable, addPlayer, removePlayer, removeGame, submitPower, submitVote, resetRound} = require("./database")

const generateCode = () => {
    return String(Math.floor(Math.random() * 90000) + 10000)
}

io.on("connection", socket => {
    socket.on("joinRandomGame", color => {
        const code = findPublicGame(color)
        if (code === -1) {
            const randomCode = generateCode()
            createGame(randomCode, color, "public")
            socket.join(randomCode)
            socket.emit("joinedRandomGame", randomCode)
        } else {
            socket.join(code)
            socket.emit("joinedRandomGame", code)
        }
    })

    socket.on("joinExistingGame", code => {
        const data = checkGameAvailable(code)
        if (data.res === -1) {
            socket.emit("joinedExistingGame", {res: -1})
        } else if (data.res === -2) {
            socket.emit("joinedExistingGame", {res: -2})
        } else {
            socket.emit("joinedExistingGame", {res: 0, color: data.color, visibility: data.visibility})
        }
    })

    socket.on("createPrivateGame", color => {
        const randomCode = generateCode()
        createGame(randomCode, color, "private")
        socket.emit("createdPrivateGame", randomCode)
    })

    socket.on("addPlayer", data => {
        socket.join(data.code)
        io.in(data.code).emit("addedPlayer", addPlayer(data.code, data.name, data.id))
    })

    socket.on("sendMessage", data => {
        io.in(data.code).emit("receiveMessage", data);
    });

    socket.on("submitPower", data => {
        io.in(data.code).emit("submittedPower", submitPower(data.code, data.id, data.power))
    })

    socket.on("submitVote", data => {
        const res = submitVote(data.code, data.id, data.vote)
        if (res.winners.length > 0) {
            removeGame(data.code)
            io.in(data.code).emit("winner", {players: res.players, winners: res.winners})
        } else {
            io.in(data.code).emit("submittedVote", {players: res.players, scorers: res.scorers})
        }
    })

    socket.on("resetRound", code => {
        io.in(code).emit("newRound", resetRound(code))
    })

    socket.on("disconnect", () => {
        const res = removePlayer(socket.id)
        if (res.code !== -1) {
            if (res.status !== "ending") {
                io.in(res.code).emit("removedPlayer", res.players)
            } else {
                removeGame(res.code)
                io.in(res.code).emit("disconnectGame")
            }
        }
    })
})

if (process.env.NODE_ENV) {
    app.use(express.static("client/build"));
    const path = require("path");
    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
    });
}

const port = process.env.PORT || 4000
server.listen(port, () => {
    console.log(`Listening on port ${port}`)
})
