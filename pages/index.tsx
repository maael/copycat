export default () => (
  <div>
    <div style={{backgroundImage: 'url(/static/cat-face.png)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', height: 100, width: '100vw'}} />
    <h1>Copycat</h1>
    <a href={`/meow-${Math.floor(Math.random()*100000)}`}>New Game</a>
  </div>
)