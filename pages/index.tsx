import Link from 'next/link';
import Header from '../components/Header';

const meowId = `/meow-${Math.floor(Math.random()*100000)}`;

export default () => (
  <div>
    <Header />
    <Link href={meowId}>
      <div style={{cursor: 'pointer', color: '#FFFFFF', fontWeight: 'bold', maxWidth: 600, margin: '0 auto', backgroundColor: '#3D5A80', padding: 20, textAlign: 'center'}}>
        Start a new game!
      </div>
    </Link>
    <div style={{maxWidth: 600, margin: '0 auto', padding: '0px 10px'}}>
      <h2>How to play</h2>
      <ol>
        <li style={{padding: 5}}>Create a game <a style={{color: '#FFFFFF', fontWeight: 'bold'}} href={`/meow-${Math.floor(Math.random()*100000)}`}>here</a></li>
        <li style={{padding: 5}}>Send the link to all your friends and wait for them to join</li>
        <li style={{padding: 5}}>Choose a category for words to guess from and start the game</li>
        <li style={{padding: 5}}>Everyone will be shown a list of words, and everyone but the copycat will see a highlighted word</li>
        <li style={{padding: 5}}>Everyone will then take turns to say a hint of what the word is, with the copycat having to say something similar to the others in hopes of blending in</li>
        <li style={{padding: 5}}>Once everyone's given their hint, you have to try to guess who the copycat is, but beware, the copycat will try to guess the word, and if they're right they win</li>
      </ol>
      That's it!
    </div>
  </div>
)