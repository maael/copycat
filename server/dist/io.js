"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = __importDefault(require("socket.io"));
const types_1 = require("./types");
const words = require('./words.json');
const io = socket_io_1.default();
console.info('starting2');
function emitPlayerChange(io, room) {
    io.to(room).emit(types_1.Events.playerChange, { players: [...rooms.get(room).players.entries()].map(([id, { name }]) => ({ id, name })) });
}
function emitGameChange(io, room) {
    io.to(room).emit(types_1.Events.gameChange, { game: rooms.get(room).game });
}
function shuffleArray(array) {
    const shuffled = [].concat(array);
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
const rooms = new Map();
io.on('connection', client => {
    const { room, playerId, name } = client.handshake.query;
    console.info('connection', room, playerId, name);
    client.emit(types_1.Events.loadCategories, { categories: Object.keys(types_1.GameCategory) });
    client.on(types_1.Events.changeCategory, ({ category }) => {
        const existingRoom = rooms.get(room);
        if (Object.values(types_1.GameCategory).includes(category)) {
            existingRoom.game.category = types_1.GameCategory[category];
            emitGameChange(io, room);
        }
    });
    if (!rooms.has(room)) {
        rooms.set(room, { io, id: room, game: {
                category: types_1.GameCategory.basic,
                words: [],
                state: types_1.GameState.start,
                votes: {
                    [types_1.GameState.start]: [],
                    [types_1.GameState.talking]: [],
                    [types_1.GameState.decision]: [],
                    [types_1.GameState.end]: [],
                    [types_1.GameState.categoryVote]: []
                }
            }, players: new Map([[playerId, { client, id: playerId, name }]]) });
    }
    else {
        const existingRoom = rooms.get(room);
        existingRoom.players.set(playerId, { client, id: playerId, name });
        rooms.set(room, existingRoom);
    }
    client.join(room);
    emitPlayerChange(io, room);
    emitGameChange(io, room);
    client.on('disconnect', () => {
        const existingRoom = rooms.get(room);
        existingRoom.players.delete(playerId);
        if (existingRoom.players.size < 1) {
            rooms.delete(room);
        }
        else {
            rooms.set(room, existingRoom);
            emitPlayerChange(io, room);
        }
    });
    client.on(types_1.Events.nameChange, ({ name }) => {
        const existingRoom = rooms.get(room);
        existingRoom.players.set(playerId, Object.assign({}, existingRoom.players.get(playerId), { name }));
        emitPlayerChange(io, room);
    });
    client.on(types_1.Events.vote, (_a) => {
        var { state } = _a, extra = __rest(_a, ["state"]);
        console.info('vote', playerId, state);
        const existingRoom = rooms.get(room);
        existingRoom.game.votes[state] = [...existingRoom.game.votes[state], { id: playerId, vote: extra }];
        if (JSON.stringify([...existingRoom.players.keys()].sort()) === JSON.stringify(existingRoom.game.votes[existingRoom.game.state].map(({ id }) => id).sort())) {
            console.info('progressing from', existingRoom.game.state);
            if (existingRoom.game.state === types_1.GameState.start) {
                existingRoom.game.state = types_1.GameState.talking;
                existingRoom.game.copycat = shuffleArray([...existingRoom.players.keys()]).pop();
                existingRoom.game.words = shuffleArray(words[existingRoom.game.category]).slice(0, 9);
                existingRoom.game.selectedWord = shuffleArray(existingRoom.game.words)[Math.floor(Math.random() * existingRoom.game.words.length)];
            }
            else if (existingRoom.game.state === types_1.GameState.categoryVote) {
                existingRoom.game.state = types_1.GameState.start;
                const categoryVotes = existingRoom.game.votes[types_1.GameState.categoryVote].map(({ vote }) => vote.category);
                const voteFrequencies = categoryVotes.reduce((ar, i) => {
                    return Object.assign({}, ar, { [i]: (ar[i] || 0) + 1 });
                }, {});
                const selected = shuffleArray(Object.entries(voteFrequencies).filter(([k, v]) => (Math.max(...Object.values(voteFrequencies)) === v))).pop();
                existingRoom.game.category = selected[0];
                existingRoom.game.votes[types_1.GameState.categoryVote] = [];
            }
            else if (existingRoom.game.state === types_1.GameState.talking) {
                existingRoom.game.state = types_1.GameState.decision;
            }
            else if (existingRoom.game.state === types_1.GameState.decision) {
                const resultVotes = existingRoom.game.votes[existingRoom.game.state];
                const copycatGuessedWord = resultVotes.find(({ vote }) => vote.hasOwnProperty('word'));
                const copycatPlayerGuesses = resultVotes.filter(({ vote }) => vote.hasOwnProperty('player')).map(({ vote }) => vote.player);
                const copycatGuessFrequencies = copycatPlayerGuesses.reduce((ar, i) => {
                    return Object.assign({}, ar, { [i]: (ar[i] || 0) + 1 });
                }, {});
                const copycatPlayerGuessCorrect = !!Object.entries(copycatGuessFrequencies).filter(([k, v]) => (Math.max(...Object.values(copycatGuessFrequencies)) === v)).find(([player]) => player === existingRoom.game.copycat);
                existingRoom.game.state = types_1.GameState.end;
                io.to(room).emit(types_1.Events.result, {
                    copycatWon: copycatGuessedWord && copycatGuessedWord.vote.word === existingRoom.game.selectedWord,
                    guessedCopycat: copycatPlayerGuessCorrect
                });
            }
        }
        emitGameChange(io, room);
    });
    client.on(types_1.Events.startCategoryVote, () => {
        const existingRoom = rooms.get(room);
        if (existingRoom.game.state === types_1.GameState.start) {
            existingRoom.game.state = types_1.GameState.categoryVote;
            emitGameChange(io, room);
        }
    });
});
io.listen(3030);
