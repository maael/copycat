import {useRef} from 'react';
import Link from 'next/link';

const styles = {
  headerCat: {
    position: 'relative',
    animationName: 'bounce',
    animationDuration: '5s',
    animationIterationCount: 'infinite',
    backgroundColor: '#EE6C4D',
    backgroundImage: 'url(/static/cat-face.png)',
    backgroundSize: 100,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'top',
    height: 110,
    width: 110,
    borderRadius: 75,
    display: 'inline-block'
  }
} as const;

function randomTime (max = 10000) {
  return Math.floor(Math.random() * (max - 3000)) + 3000;
}

export default () => {
  const init = useRef<boolean>();
  const meowEl = useRef<HTMLElement>();

  function meow () {
    if (meowEl.current) {
      meowEl.current.style.opacity = meowEl.current.style.opacity === '0' ? '1' : '0';
      setTimeout(meow, randomTime(meowEl.current.style.opacity === '1' ? 4000 : 10000));
    }
  }

  return (
    <Link href='/'>
      <div style={{width: '100vw', textAlign: 'center', marginTop: '2em', cursor: 'pointer', position: 'relative'}}>
        <span style={styles.headerCat} />
        <h1>Copycat</h1>
        <div style={{
          position: 'absolute',
          top: 55,
          left: '50%',
          marginLeft: 60,
          opacity: 0,
          transition: 'opacity 0.5s'
        }} ref={(ref) => {
          meowEl.current = ref;
          if (!init.current) {
            init.current = true;
            setTimeout(meow, randomTime());
          }
        }}>
          <div style={{
            position: 'relative',
            animationName: 'bounce',
            animationDuration: '5s',
            animationDelay: '0.5s',
            animationIterationCount: 'infinite',
            backgroundColor: '#FFFFFF',
            borderRadius: 5,
            color: '#000000',
            fontFamily: 'monospace',
            padding: 10
          }}>Meow</div>
        </div>
      </div>
    </Link>
  );
};