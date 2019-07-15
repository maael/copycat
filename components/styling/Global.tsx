export default () => (
  <style global jsx>{`
    html, body {
      font-family: sans-serif;
    }
    body {
      background-color: #293241;
      color: #E0FBFC;
      display: flex;
    }
    a {
      text-decoration: none;
    }
    @keyframes bounce {
      0% {top: 0px;}
      10% {top: 0px;}
      45% {top: -5px;}
      55% {top: -5px;}
      90% {top: 0px;}
      100% {top: 0px;}
    }

    button {
      position: relative;
    }

    button:hover {
      top: -2px;
    }
  `}</style>
)