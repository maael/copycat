import React from 'react';
import Link from 'next/link';
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

const styles = {
  button: {
    backgroundColor: '#EE6C4D',
    border: 'none',
    borderRadius: 3,
    color: '#FFFFFF',
    cursor: 'pointer',
    margin: 5,
    padding: 5,
    maxWidth: 200,
    height: 50,
    width: '50vw'
  },
  header: {
    margin: '0 auto',
    maxWidth: 600,
  },
  input: {
    backgroundColor: '#E2FBFC',
    border: 'none',
    borderRadius: 3,
    padding: 5,
    marginLeft: 10
  },
  center: {
    textAlign: 'center' as 'center',
    width: '100vw'
  }
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
      {words.map((word) => <div key={word} style={{padding: 20, width: '30vw', textAlign: 'center', backgroundColor: selectedWord === word && !isPlayerTheCopycat ? '#EE6C4D' : 'initial', cursor: onClick ? 'pointer' : 'default'}} onClick={() => onClick && onClick(word)}>{word}</div>)}
    </div>
  ))
)

const PlayerList = (players: Pick<Player, 'id' | 'name'>[], playerId: string, onClick: (id: string) => void) => (
  players.filter(({id}) => id !== playerId).map(({id, name}) => (
    <span key={id} style={{padding: 10, background: '#EE6C4D', borderRadius: 5, margin: 5, color: 'white', cursor: 'pointer'}} onClick={() => onClick(id)}>
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
      name: name || '😺 Mysterious Cat'
    });
    const hostnameParts = window.location.hostname.split('.');
    if (window.location.hostname !== 'localhost') {
      hostnameParts.splice(0, 1, `${hostnameParts[0]}-ws`);
    }
    const hostname = hostnameParts.join('.');
    const port = window.location.hostname === 'localhost' ? ':3030' : '';
    console.info('connecting to', `${window.location.protocol}//${hostname}${port}`);
    this.socket = io(`${window.location.protocol}//${hostname}${port}`, {
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
        <Link href='/'>
          <div style={{width: '100vw', textAlign: 'center', marginTop: '2em', cursor: 'pointer'}}>
            <span style={{backgroundColor: '#EE6C4D', backgroundImage: 'url(/static/cat-face.png)', backgroundSize: 100, backgroundRepeat: 'no-repeat', backgroundPosition: 'top', height: 110, width: 110, borderRadius: 75, display: 'inline-block'  }} />
            <h1>Copycat</h1>
          </div>
        </Link>
        <div>
          <div style={styles.center}>
            Your name
            <input style={styles.input} type='text' placeholder='Your name' value={this.state.name} onChange={({target}) => {
              if (target.value.length > 50) return;
              this.setState({name: target.value})
              this.socket.emit(Events.nameChange, {name: target.value})
            }} />
          </div>
          <div style={styles.header}>
            <h2>Players</h2>
          </div>
          <div style={styles.center}>
            {this.state.players.filter(({id}) => id !== this.state.playerId).map(({id, name}) => {
              return (
                <span key={id} style={{padding: 10, background: '#EE6C4D', borderRadius: 5, margin: 5, color: 'white'}}>
                  {name || id}
                  {this.state.game.state !== GameState.end ? this.state.game && this.state.game.state && this.state.game.votes[this.state.game.state] && this.state.game.votes[this.state.game.state].find(({id: voteId}) => voteId === id) ? ' ✅' : '❔' : null}
                </span>
              )
            })}
          </div>
          <div style={styles.header}>
            <h2>Game</h2>
          </div>
          {this.state.result ? (
            <div style={styles.center}>
              {this.state.result.copycatWon ? <div>The copycat guessed the word correcty!</div> : null}
              {this.state.result.guessedCopycat ? <div>The team guessed who the copycat was!</div> : null}
            </div>
          ) : null}
          {isPlayerTheCopycat ? <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100, width: '100vw'}}>
            <span style={{backgroundColor: '#EE6C4D', backgroundImage: 'url(/static/cat-face.png)', backgroundSize: 50, backgroundRepeat: 'no-repeat', backgroundPosition: 'top', height: 55, width: 55, borderRadius: 75, display: 'inline-block', marginRight: 10 }} />
            You are the copycat!
          </div> : ''}
          {this.state.game && this.state.game.state === GameState.start ? (
            <div style={styles.center}>
              {isPlayerDone ? null : <button style={styles.button} onClick={() => {
                this.socket.emit(Events.vote, {state: this.state.game.state});
              }}>Ready?</button>}
              {isPlayerDone ? null : <button style={styles.button} onClick={() => {
                this.socket.emit(Events.startCategoryVote);
              }}>Vote to change category</button>}
            </div>
          ) : this.state.game && this.state.game.state === GameState.categoryVote ? (
            <div style={styles.center}>
              <select value={this.state.game.category} onChange={({target}) => {
                this.socket.emit(Events.vote, {state: this.state.game.state, category: target.value});
              }}>
                {this.state.categories.map((category) =>
                  <option key={category} value={category}>{category}</option>
                )}
              </select>
            </div>
          ) : this.state.game && this.state.game.state === GameState.talking ? (
            <>
              {WordsBox(this.state.game.words, isPlayerTheCopycat, this.state.game.selectedWord)}
              <div style={styles.center}>
                {isPlayerDone ? null : <button style={styles.button} onClick={() => {
                  this.socket.emit(Events.vote, {state: this.state.game.state});
                }}>Had my turn!</button>}
              </div>
            </>
          ) : this.state.game && this.state.game.state === GameState.decision ? (
            <>
              {WordsBox(this.state.game.words, isPlayerTheCopycat, this.state.game.selectedWord, isPlayerTheCopycat ? (word) => {
                this.socket.emit(Events.vote, {state: this.state.game.state, word});
              } : undefined)}
              <div style={styles.center}>
              {isPlayerTheCopycat ? <div style={{margin: 20}}>What's the word?</div> : (
                <>
                  <div style={{margin: 20}}>Who's the copycat!?!</div>
                  <div style={styles.center}>
                    {PlayerList(this.state.players, this.state.playerId, (id) => {
                      this.socket.emit(Events.vote, {state: this.state.game.state, player: id});
                    })}
                  </div>
                </>
              )}
              </div>
            </>
          ) : this.state.game && this.state.game.state === GameState.end ? (
            <div style={styles.center}>
              {isPlayerDone ? null : <button style={styles.button} onClick={() => {
                this.socket.emit(Events.vote, {state: this.state.game.state});
              }}>Reset!</button>}
            </div>
          ) :null}
        </div>
      </div>
    )
  }
}