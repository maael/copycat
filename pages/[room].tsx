import React from 'react';
import io from 'socket.io-client';
import uuid from 'uuid/v4';

import {Game, Player, Events, GameState, Result} from '../server/types';

interface State {
  players: Pick<Player, 'id' | 'name'>[];
  playerId?: string;
  name: string;
  game: Partial<Game>;
  categories: string[];
  result?: Result;
}

const chunk = (arr: string[]) => {
  return arr.reduce<string[][]>((ar, el, i) => {
    const idx = (i + 1) % 3;
      ar[idx] = ar[idx] ? ar[idx].concat(el) : [el];
      return ar;
    }, [])
}

const WordsBox = (words: string[], isPlayerTheCopycat: boolean, selectedWord: string, onClick?: (word: string) => void) => (
  chunk(words).map((words, i) => (
    <div key={i} style={{display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100vw'}}>
      {words.map((word) => <div key={word} style={{padding: 20, width: '30vw', textAlign: 'center', backgroundColor: selectedWord === word && !isPlayerTheCopycat ? 'blue' : 'initial'}} onClick={() => onClick && onClick(word)}>{word}</div>)}
    </div>
  ))
)

const PlayerList = (players: Pick<Player, 'id' | 'name'>[], playerId: string, onClick: (id: string) => void) => (
  players.filter(({id}) => id !== playerId).map(({id, name}) => (
    <span key={id} style={{padding: 5, background: 'rebeccapurple', cursor: 'pointer', borderRadius: 5, margin: 5, color: 'white'}} onClick={() => onClick(id)}>
      {name || id}
    </span>
  ))
);

export default class Index extends React.Component<{room?: string}, State> {
  state: State = {
    players: [],
    playerId: undefined,
    name: '',
    game: {},
    categories: []
  }
  socket: typeof io;

  static async getInitialProps({ query }) {
    const {room} = query
    return {room}
  }

  componentDidMount () {
    let playerId, name;
    const {room} = this.props;
    if (typeof window !== undefined) {
      const initialPlayerId = window.localStorage.getItem('playerId');
      playerId = initialPlayerId && initialPlayerId !== 'undefined' ? initialPlayerId : uuid();
      window.localStorage.setItem('playerId', playerId);
      const initialPlayer = JSON.parse(window.localStorage.getItem('player'));
      name = initialPlayer && initialPlayer.name
      this.setState({playerId, name});
    }
    const params = new URLSearchParams({
      room,
      playerId,
      name
    });
    this.socket = io(`${window.location.protocol}//${window.location.hostname}:3030`, {
      query: params.toString()
    });
    this.socket.on(Events.loadCategories, ({categories}) => {
      console.info('loadCategories', categories);
      this.setState({categories})
    })
    this.socket.on(Events.playerChange, ({players}) => {
      console.info('playerChange', players);
      this.setState({players})
    });
    this.socket.on(Events.gameChange, ({game}) => {
      console.info('gameChange', game);
      this.setState({game})
    });
    this.socket.on(Events.result, (result) => {
      this.setState({result})
    });
  }
  componentDidUpdate (_props, {playerId, name}: State) {
    if (typeof window !== undefined) {
      window.localStorage.setItem('player', JSON.stringify({playerId, name}));
      window.localStorage.setItem('playerId', playerId);
    }
  }
  render () {
    const isPlayerTheCopycat = this.state.game.copycat && this.state.game.copycat === this.state.playerId;
    const isPlayerDone = this.state.game && this.state.game.state && this.state.game.votes[this.state.game.state] && this.state.game.votes[this.state.game.state].find(({id}) => id === this.state.playerId);
    return (
      <div>
        <div style={{backgroundImage: 'url(/static/cat-face.png)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', height: 100, width: '100vw'}} />
        <h2>Players</h2>
        <input type='text' placeholder='Your name' value={this.state.name} onChange={({target}) => {
          this.setState({name: target.value})
          this.socket.emit(Events.nameChange, {name: target.value})
        }} />
        {this.state.players.filter(({id}) => id !== this.state.playerId).map(({id, name}) => {
          return (
            <span key={id} style={{padding: 5, background: 'rebeccapurple', borderRadius: 5, margin: 5, color: 'white'}}>
              {name || id}
              {this.state.game.state !== GameState.end ? this.state.game && this.state.game.state && this.state.game.votes[this.state.game.state] && this.state.game.votes[this.state.game.state].find(({id: voteId}) => voteId === id) ? '✅' : '❔' : null}
            </span>
          )
        })}
        <h2>Game</h2>
        {this.state.result ? (
          <>
            {this.state.result.copycatWon ? 'The copycat guessed the word correcty!' : null}
            {this.state.result.guessedCopycat ? 'The team guessed who the copycat was!' : null}
          </>
        ) : null}
        {/* {JSON.stringify(this.state.game)} */}
        {isPlayerTheCopycat ? <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100, width: '100vw'}}>You are the copycat!</div> : ''}
        {this.state.game && this.state.game.state === GameState.start ? (
          <>
            {isPlayerDone ? null : <button onClick={() => {
              this.socket.emit(Events.vote, {state: this.state.game.state});
            }}>Ready?</button>}
            {isPlayerDone ? null : <button onClick={() => {
              this.socket.emit(Events.startCategoryVote);
            }}>Vote to change category</button>}
          </>
        ) : this.state.game && this.state.game.state === GameState.categoryVote ? (
          <>
            <select value={this.state.game.category} onChange={({target}) => {
              this.socket.emit(Events.vote, {state: this.state.game.state, category: target.value});
            }}>
              {this.state.categories.map((category) =>
                <option key={category} value={category}>{category}</option>
              )}
            </select>
          </>
        ) : this.state.game && this.state.game.state === GameState.talking ? (
          <>
            {WordsBox(this.state.game.words, isPlayerTheCopycat, this.state.game.selectedWord)}
            {isPlayerDone ? null : <button onClick={() => {
              this.socket.emit(Events.vote, {state: this.state.game.state});
            }}>Had my turn!</button>}
          </>
        ) : this.state.game && this.state.game.state === GameState.decision ? (
          <>
            {WordsBox(this.state.game.words, isPlayerTheCopycat, this.state.game.selectedWord, isPlayerTheCopycat ? (word) => {
              console.info('word', word);
              this.socket.emit(Events.vote, {state: this.state.game.state, word});
            } : undefined)}
            {isPlayerTheCopycat ? 'What\'s the word?' : (
              <>
                Who's the copycat!?!
                {PlayerList(this.state.players, this.state.playerId, (id) => {
                  console.info('-> id', id);
                  this.socket.emit(Events.vote, {state: this.state.game.state, player: id});
                })}
              </>
            )}
          </>
        ) : this.state.game && this.state.game.state === GameState.end ? (
          <>
            {isPlayerDone ? null : <button onClick={() => {
              this.socket.emit(Events.vote, {state: this.state.game.state});
            }}>Reset!</button>}
          </>
        ) :null}
      </div>
    )
  }
}