const {greenSituations, greenPowers, yellowSituations, yellowPowers} = require("./cards");

const shuffleArray = array => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array
}

let games = []

const findGame = code => {
    return games.findIndex(game => game.code === code)
}

const findPublicGame = color => {
    const index = games.findIndex(
        game => game.color === color && game.visibility === "public" && game.status === "waiting"
    )
    if (index === -1) return -1
    else return games[index].code
}

const createGame = (code, color, visibility) => {
    let situations = color === "green" ? greenSituations : yellowSituations
    let powers = color === "green" ? greenPowers : yellowPowers
    let game = {
        code: code,
        color: color,
        visibility: visibility,
        status: "waiting",
        players: [],
        situations: shuffleArray(situations),
        powersDeck: shuffleArray(powers),
        scorers: [],
        winners: []
    }
    games.push(game)
}

const checkGameAvailable = code => {
    const index = findGame(code)
    if (index === -1) {
        return {res: -1}
    } else {
        if (games[index].status === "playing") {
            return {res: -2}
        } else {
            return {res: 0, color: games[index].color, visibility: games[index].visibility}
        }
    }
}

const addPlayer = (code, name, id) => {
    const index = findGame(code)
    const player = {
        name: name,
        id: id,
        cards: [],
        score: 0,
        power: -1,
        vote: -1
    }
    games[index].players.push(player)
    if (games[index].players.length === 4) {
        games[index].status = "playing"
        for (let i = 0; i < games[index].players.length; i++) {
            for (let j = 0; j < 5; j++) {
                games[index].players[i].cards.push(games[index].powersDeck[games[index].powersDeck.length - 1])
                games[index].powersDeck.pop()
            }
        }
    }
    return {players: games[index].players, situations: games[index].situations}
}

const removePlayer = id => {
    for (let game of games) {
        for (let player of game.players) {
            if (player.id === id) {
                for (let power of player.cards) {
                    game.powersDeck.unshift(power)
                }
                game.players = game.players.filter(player => {return player.id !== id})
                if ((game.players.length === 2 && game.status === "playing") || (game.players.length === 0 && game.status === "waiting")) {
                    game.status = "ending"
                }
                return {code: game.code, players: game.players, status: game.status}
            }
        }
    }
    return {code: -1}
}

const removeGame = code => {
    games.splice(findGame(code), 1)
}

const submitPower = (code, id, power) => {
    const index = findGame(code)
    const index2 = games[index].players.findIndex(player => player.id === id)
    games[index].players[index2].power = power
    return games[index].players
}

const submitVote = (code, id, vote) => {
    const index = findGame(code)
    const index2 = games[index].players.findIndex(player => player.id === id)
    games[index].players[index2].vote = vote
    const notVoted = games[index].players.findIndex(player => player.vote === -1)
    if (notVoted === -1) {
        findWinners(code)
    }
    return {players: games[index].players, winners: games[index].winners, scorers: games[index].scorers}
}

const findWinners = code => {
    const index = findGame(code)
    let count = new Map()
    for (let player of games[index].players) {
        if (!count.get(player.vote)) count.set(player.vote, 1)
        else count.set(player.vote, count.get(player.vote) + 1);
    }
    const max = Math.max(0, ...count.values())
    for (const [key, value] of count.entries()) {
        if (value === max) {
            const index2 = games[index].players.findIndex(player => player.id === key)
            games[index].players[index2].score++
            if (games[index].players[index2].score === 5) {
                games[index].winners.push(games[index].players[index2].name)
            }
            games[index].scorers.push(games[index].players[index2].name)
        }
    }
}

const resetRound = code => {
    const index = findGame(code)
    games[index].winners = []
    games[index].scorers = []
    for (let player of games[index].players) {
        games[index].powersDeck.unshift(player.cards[player.power])
        player.cards.splice(player.power, 1)
        player.cards.push(games[index].powersDeck[games[index].powersDeck.length - 1])
        games[index].powersDeck.pop()
        player.power = -1
        player.vote = -1
    }
    return games[index].players
}

module.exports = {findPublicGame, createGame, checkGameAvailable, addPlayer, removePlayer, removeGame, submitPower, submitVote, findWinners, resetRound}
