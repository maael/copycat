import socketio from "socket.io";
import {GameCategory, GameState, Room, Player, Events} from './types';
const words: Record<GameCategory, string[]> = require('./words.json');

const io = socketio();

console.info('starting io');

function emitPlayerChange (io: socketio.Server, room: string) {
  io.to(room).emit(Events.playerChange, {players: [...rooms.get(room).players.entries()].map(([id, {name}]) => ({id, name}))});
}

function emitGameChange (io: socketio.Server, room: string) {
  io.to(room).emit(Events.gameChange, {game: rooms.get(room).game});
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [].concat(array);
  for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const rooms = new Map<string, Room>();

io.on('connection', client => {
  const {room, playerId, name} = client.handshake.query;
  console.info('connection', room, playerId, name);
  client.emit(Events.loadCategories, {categories: Object.keys(GameCategory)})
  client.on(Events.changeCategory, ({category}) => {
    const existingRoom = rooms.get(room);
    if (Object.values(GameCategory).includes(category)) {
      existingRoom.game.category = GameCategory[category] as GameCategory;
      emitGameChange(io, room);
    }
  });
  if (!rooms.has(room)) {
    rooms.set(room, {io, id: room, game: {
      category: GameCategory.basic,
      words: [],
      state: GameState.start,
      votes: {
        [GameState.start]: [],
        [GameState.talking]: [],
        [GameState.decision]: [],
        [GameState.end]: [],
        [GameState.categoryVote]: []
      }
    }, players: new Map<string, Player>([[playerId, {client, id: playerId, name}]])});
  } else {
    const existingRoom = rooms.get(room);
    existingRoom.players.set(playerId, {client, id: playerId, name});
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
    } else {
      rooms.set(room, existingRoom);
      emitPlayerChange(io, room);
    }
  });
  client.on(Events.nameChange, ({name}) => {
    const existingRoom = rooms.get(room);
    existingRoom.players.set(playerId, {...existingRoom.players.get(playerId), name});
    emitPlayerChange(io, room);
  });
  client.on(Events.vote, ({state, ...extra}) => {
    console.info('vote', playerId, state);
    const existingRoom = rooms.get(room);
    existingRoom.game.votes[state] = [...existingRoom.game.votes[state], {id: playerId, vote: extra}];
    if (JSON.stringify([...existingRoom.players.keys()].sort()) === JSON.stringify(existingRoom.game.votes[existingRoom.game.state].map(({id}) => id).sort())) {
      console.info('progressing from', existingRoom.game.state);
      if (existingRoom.game.state === GameState.start) {
        existingRoom.game.state = GameState.talking;
        existingRoom.game.copycat = shuffleArray([...existingRoom.players.keys()]).pop();
        existingRoom.game.words = shuffleArray(words[existingRoom.game.category]).slice(0, 9);
        existingRoom.game.selectedWord = shuffleArray(existingRoom.game.words)[Math.floor(Math.random() * existingRoom.game.words.length)];
      } else if (existingRoom.game.state === GameState.categoryVote) {
        existingRoom.game.state = GameState.start;
        const categoryVotes: string[] = existingRoom.game.votes[GameState.categoryVote].map(({vote}) => vote.category);
        const voteFrequencies: {[k: string]: number} = categoryVotes.reduce((ar, i) => {
          return {...ar, [i]: (ar[i] || 0) + 1}
        }, {});
        const selected = shuffleArray(Object.entries(voteFrequencies).filter(([k, v]) => (
          Math.max(...Object.values(voteFrequencies)) === v
        ))).pop();
        existingRoom.game.category = selected[0] as GameCategory;
        existingRoom.game.votes[GameState.categoryVote] = [];
      } else if (existingRoom.game.state === GameState.talking) {
        existingRoom.game.state = GameState.decision;
      } else if (existingRoom.game.state === GameState.decision) {
        const resultVotes = existingRoom.game.votes[existingRoom.game.state];
        const copycatGuessedWord = resultVotes.find(({vote}) => vote.hasOwnProperty('word'));
        const copycatPlayerGuesses: string[] = resultVotes.filter(({vote}) => vote.hasOwnProperty('player')).map(({vote}) => vote.player);
        const copycatGuessFrequencies: Record<string, number> = copycatPlayerGuesses.reduce((ar, i) => {
          return {...ar, [i]: (ar[i] || 0) + 1}
        }, {});
        const copycatPlayerGuessCorrect = !!Object.entries(copycatGuessFrequencies).filter(([k, v]) => (
          Math.max(...Object.values(copycatGuessFrequencies)) === v
        )).find(([player]) => player === existingRoom.game.copycat);
        existingRoom.game.state = GameState.end;
        io.to(room).emit(Events.result, {
          copycatWon: copycatGuessedWord && copycatGuessedWord.vote.word === existingRoom.game.selectedWord,
          guessedCopycat: copycatPlayerGuessCorrect
        });
      }
    }
    emitGameChange(io, room);
  });
  client.on(Events.startCategoryVote, () => {
    const existingRoom = rooms.get(room);
    if (existingRoom.game.state === GameState.start) {
      existingRoom.game.state = GameState.categoryVote;
      emitGameChange(io, room);
    }
  });
});
io.listen(3030);