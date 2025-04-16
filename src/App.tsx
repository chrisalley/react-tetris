import Board from "./components/Board";
import { useTetris } from "./hooks/useTetris";

export default function App() {
  const { board, startGame, isPlaying } = useTetris();

  return (
    <div className="app">
      <h1>Tetris</h1>
      <Board currentBoard={board} />
      <div className="controls">
        {isPlaying ? null : <button onClick={startGame}>New Game</button>}
      </div>
    </div>
  );
}
