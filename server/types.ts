import {Server, Socket} from "socket.io";

export enum GameCategory {
  'Basic' = 'Basic',
  'Food' = 'Food',
  'Drinks' = 'Drinks',
  'Alcohol' = 'Alcohol',
  'Musicals' = 'Musicals',
  'Zoo' = 'Zoo',
  'Jobs' = 'Jobs',
  'Movies' = 'Movies',
  'Star Wars' = 'Star Wars',
  'Transport' = 'Transport',
  'Classic Boardgames' = 'Classic Boardgames'
}

export enum GameState {
  start = 'start',
  talking = 'talking',
  decision = 'decision',
  end = 'end',
  categoryVote = 'categoryVote'
}

export interface Game {
  category: GameCategory;
  words: string[];
  state: GameState;
  votes: Record<GameState, {id: string, vote: any}[]>;
  copycat?: string;
  selectedWord?: string;
}

export interface Room {
  io: Server;
  id: string;
  players: Map<string, Player>;
  game: Game;
}

export interface Player {
  client: Socket;
  id: string;
  name?: string;
}

export enum Events {
  loadCategories = 'loadCategories',
  playerChange = 'playerChange',
  gameChange = 'gameChange',
  vote = 'vote',
  changeCategory = 'changeCategory',
  nameChange = 'nameChange',
  startCategoryVote = 'startCategoryVote',
  result = 'result',
  waitForStart = 'waitForStart',
}

export interface Result {
  copycatWon: boolean;
  guessedCopycat: boolean;
}