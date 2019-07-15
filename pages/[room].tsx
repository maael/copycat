import React from 'react';
import Link from 'next/link';
import io from 'socket.io-client';
import uuid from 'uuid/v4';

import Header from '../components/Header';

import {Game, Player, Events, GameState, Result} from '../server/types';

interface State {
  players: Pick<Player, 'id' | 'name'>[];
  playerId?: string;
  name: string;
  game: Partial<Game>;
  categories: string[];
  result?: Result;
  showJoin: boolean;
  waitingForStart: boolean;
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
    padding: '0 10px'
  },
  input: {
    backgroundColor: '#E2FBFC',
    border: 'none',
    borderRadius: 3,
    padding: 5,
    marginLeft: 10
  },
  center: {
    textAlign: 'center',
    width: '100vw'
  },
  shareBanner: {
    backgroundColor: '#F1866D',
    textAlign: 'center',
    fontSize: 14,
    padding: '2px 20px'
  },
  shareBannerLink: {
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  shareBannerClose: {
    cursor: 'pointer',
    position: 'absolute',
    right: 10,
    top: 1
  },
  playerTag: {
    padding: 10,
    background: '#EE6C4D',
    borderRadius: 5,
    margin: 5,
    color: 'white'
  },
  copycatBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    width: '100vw'
  },
  copycatCat: {
    backgroundColor: '#EE6C4D',
    backgroundImage: 'url(/static/cat-face.png)',
    backgroundSize: 50,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'top',
    height: 55,
    width: 55,
    borderRadius: 75,
    display: 'inline-block',
    marginRight: 10
  },
  margined: {
    margin: 20
  },
  winBanner: {
    padding: 10,
    backgroundColor: '#EE6C4D',
    margin: 5
  },
  butBanner: {
    color: '#EE6C4D',
    fontSize: 32,
    padding: 10,
    margin: 15
  }
} as const;

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
    categories: [],
    showJoin: true,
    waitingForStart: false
  }
  socket: typeof io;

  static async getInitialProps({ query }) {
    const {room} = query
    return {room}
  }

  connect = () => {
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
    this.socket.on(Events.loadCategories, ({categories}) => this.setState({categories}));
    this.socket.on(Events.playerChange, ({players}) => {
      console.info('playerChange', players);
      this.setState({players})
    });
    this.socket.on(Events.gameChange, ({game}) => {
      console.info('gameChange', game);
      const {waitingForStart} = this.state;
      this.setState({game, waitingForStart: game.state === GameState.start ? false : waitingForStart});
      if (game.state === GameState.start && waitingForStart) {
        this.socket.disconnect();
        this.connect();
      }
    });
    this.socket.on(Events.result, (result) => this.setState({result}));
    this.socket.on(Events.waitForStart, () => this.setState({waitingForStart: true}));
  }

  componentDidMount () {
    this.connect();
    if (typeof window !== 'undefined') {
      this.setState({showJoin: !!!localStorage.getItem(window.location.pathname)});
    }
  }
  componentDidUpdate (_props, {playerId, name}: State) {
    if (typeof window !== undefined) {
      window.localStorage.setItem('player', JSON.stringify({playerId, name}));
      window.localStorage.setItem('playerId', playerId);
    }
  }
  render () {
    const {showJoin, game, playerId, name, players, result, categories, waitingForStart} = this.state;
    const isPlayerTheCopycat = game.copycat && game.copycat === playerId;
    const isPlayerDone = game && game.state && game.votes[game.state] && game.votes[game.state].find(({id}) => id === playerId);
    return(
      <div>
        {game.state === GameState.start && showJoin ? (
          <div style={styles.shareBanner}>
            Share <a style={styles.shareBannerLink} href={typeof window !== 'undefined' ? window.location.href : ''}>{typeof window !== 'undefined' ? window.location.href : ''}</a> with your friends
            <span onClick={() => {
              this.setState({showJoin: false});
              if (typeof window !== 'undefined') {
                localStorage.setItem(window.location.pathname, 'true');
              }
            }} style={styles.shareBannerClose}>x</span>
          </div>
        ) : null}
        <Header />
        {waitingForStart ? (
          <div style={styles.center}>Game in progress, waiting for it to finish</div>
        ) : (
          <div>
            <div style={styles.center}>
              Your name
              <input style={styles.input} type='text' placeholder='Your name' value={name || ''} onChange={({target}) => {
                if (target.value.length > 50) return;
                this.setState({name: target.value})
                this.socket.emit(Events.nameChange, {name: target.value})
              }} />
            </div>
            <div style={styles.header}>
              <h2>Players</h2>
            </div>
            <div style={styles.center}>
              {players.filter(({id}) => id !== playerId).map(({id, name}) => {
                return (
                  <span key={id} style={styles.playerTag}>
                    {name || id}
                    {game.state !== GameState.end ? game && game.state && game.votes[game.state] && game.votes[game.state].find(({id: voteId}) => voteId === id) ? ' ✅' : '❔' : null}
                  </span>
                )
              })}
            </div>
            <div style={styles.header}>
              <h2>Game <small>(Category: {game.category})</small></h2>
            </div>
            {result ? (
              <div style={styles.center}>
                {result.guessedCopycat ? <div style={styles.winBanner}>The team guessed who the copycat was!</div> : null}
                {result.guessedCopycat && result.copycatWon ? <div style={styles.butBanner}>BUT</div> : null}
                {result.copycatWon ? <div style={styles.winBanner}>The copycat guessed the word correcty!</div> : null}
              </div>
            ) : null}
            {isPlayerTheCopycat ? <div style={styles.copycatBanner}>
              <span style={styles.copycatCat} />
              You are the copycat!
            </div> : ''}
            {game && game.state === GameState.start ? (
              <div style={styles.center}>
                {isPlayerDone ? null : <button style={styles.button} onClick={() => {
                  this.socket.emit(Events.vote, {state: game.state});
                }}>Ready?</button>}
                {isPlayerDone ? null : <button style={styles.button} onClick={() => {
                  this.socket.emit(Events.startCategoryVote);
                }}>Vote to change category</button>}
              </div>
            ) : game && game.state === GameState.categoryVote ? (
              <div style={styles.center}>
                <select value={game.category} onChange={({target}) => {
                  this.socket.emit(Events.vote, {state: game.state, category: target.value});
                }}>
                  {categories.map((category) =>
                    <option key={category} value={category}>{category}</option>
                  )}
                </select>
              </div>
            ) : game && game.state === GameState.talking ? (
              <>
                {WordsBox(game.words, isPlayerTheCopycat, game.selectedWord)}
                <div style={styles.center}>
                  {isPlayerDone ? null : <button style={styles.button} onClick={() => {
                    this.socket.emit(Events.vote, {state: game.state});
                  }}>Had my turn!</button>}
                </div>
              </>
            ) : game && game.state === GameState.decision ? (
              <>
                {WordsBox(game.words, isPlayerTheCopycat, game.selectedWord, isPlayerTheCopycat ? (word) => {
                  this.socket.emit(Events.vote, {state: game.state, word});
                } : undefined)}
                <div style={styles.center}>
                {isPlayerTheCopycat ? <div style={styles.margined}>What's the word?</div> : (
                  <>
                    <div style={styles.margined}>Who's the copycat!?!</div>
                    <div style={styles.center}>
                      {PlayerList(players, playerId, (id) => {
                        this.socket.emit(Events.vote, {state: game.state, player: id});
                      })}
                    </div>
                  </>
                )}
                </div>
              </>
            ) : game && game.state === GameState.end ? (
              <div style={styles.center}>
                {isPlayerDone ? null : <button style={styles.button} onClick={() => {
                  this.setState({result: undefined});
                  this.socket.emit(Events.vote, {state: game.state});
                }}>Reset!</button>}
              </div>
            ) :null}
          </div>
        )}
      </div>
    )
  }
}