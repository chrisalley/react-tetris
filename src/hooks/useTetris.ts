import { useCallback, useEffect, useState } from "react";
import {
  getRandomBlock,
  hasCollisions,
  useTetrisBoard,
} from "./useTetrisBoard";
import { useInterval } from "./useInterval";
import { Block, BlockShape, BoardShape } from "../types";

enum TickSpeed {
  Normal = 800,
  Sliding = 100,
  Fast = 50,
}

export function useTetris() {
  const [isCommitting, setIsCommitting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tickSpeed, setTickSpeed] = useState<TickSpeed | null>(null);
  const [upcomingBlocks, setUpcomingBlocks] = useState<Block[]>([]);

  const [
    { board, droppingRow, droppingColumn, droppingBlock, droppingShape },
    dispatchBoardState,
  ] = useTetrisBoard();

  function addShapeToBoard(
    board: BoardShape,
    droppingBlock: Block,
    droppingShape: BlockShape,
    droppingRow: number,
    droppingColumn: number
  ) {
    droppingShape
      .filter((row) => row.some((isSet) => isSet))
      .forEach((row: boolean[], rowIndex: number) => {
        row.forEach((isSet: boolean, colIndex: number) => {
          if (isSet) {
            board[droppingRow + rowIndex][droppingColumn + colIndex] =
              droppingBlock;
          }
        });
      });
  }

  const commitPosition = useCallback(() => {
    if (!hasCollisions(board, droppingShape, droppingRow + 1, droppingColumn)) {
      setIsCommitting(false);
      setTickSpeed(TickSpeed.Normal);
      return;
    }

    const newBoard = structuredClone(board);
    addShapeToBoard(
      newBoard,
      droppingBlock,
      droppingShape,
      droppingRow,
      droppingColumn
    );

    const newUpcomingBlocks = structuredClone(upcomingBlocks);
    const newBlock = newUpcomingBlocks.pop();
    newUpcomingBlocks.unshift(getRandomBlock());

    setTickSpeed(TickSpeed.Normal);
    setUpcomingBlocks(newUpcomingBlocks);
    dispatchBoardState({ type: "commit", newBoard, newBlock });
    setIsCommitting(false);
  }, [
    board,
    dispatchBoardState,
    droppingBlock,
    droppingColumn,
    droppingRow,
    droppingShape,
    upcomingBlocks,
  ]);

  const gameTick = useCallback(() => {
    if (isCommitting) {
      commitPosition();
    } else if (
      hasCollisions(board, droppingShape, droppingRow + 1, droppingColumn)
    ) {
      setTickSpeed(TickSpeed.Sliding);
      setIsCommitting(true);
    } else {
      dispatchBoardState({ type: "drop" });
    }
  }, [
    dispatchBoardState,
    board,
    commitPosition,
    droppingColumn,
    droppingRow,
    droppingShape,
    isCommitting,
  ]);

  useInterval(() => {
    if (!isPlaying) {
      return;
    }
    gameTick();
  }, tickSpeed);

  const startGame = useCallback(() => {
    const startingBlocks = [
      getRandomBlock(),
      getRandomBlock(),
      getRandomBlock(),
    ];
    setUpcomingBlocks(startingBlocks);
    setIsPlaying(true);
    setTickSpeed(TickSpeed.Normal);
    dispatchBoardState({ type: "start" });
  }, [dispatchBoardState]);

  const renderedBoard = structuredClone(board);
  if (isPlaying) {
    addShapeToBoard(
      renderedBoard,
      droppingBlock,
      droppingShape,
      droppingRow,
      droppingColumn
    );
  }

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    let isPressingLeft = false;
    let isPressingRight = false;
    let moveIntervalId: number | undefined;

    const updateMovementInterval = () => {
      clearInterval(moveIntervalId);
      dispatchBoardState({
        type: "move",
        isPressingLeft,
        isPressingRight,
      });
      moveIntervalId = setInterval(() => {
        dispatchBoardState({
          type: "move",
          isPressingLeft,
          isPressingRight,
        });
      }, 300);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      if (event.key === "ArrowDown") {
        setTickSpeed(TickSpeed.Fast);
      }

      if (event.key === "ArrowUp") {
        dispatchBoardState({
          type: "move",
          isRotating: true,
        });
      }

      if (event.key === "ArrowLeft") {
        isPressingLeft = true;
      }

      if (event.key === "ArrowRight") {
        isPressingRight = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        setTickSpeed(TickSpeed.Normal);
      }

      if (event.key === "ArrowLeft") {
        isPressingLeft = false;
        updateMovementInterval();
      }

      if (event.key === "ArrowRight") {
        isPressingRight = false;
        updateMovementInterval();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      setTickSpeed(TickSpeed.Normal);
    };
  }, [isPlaying]);

  return {
    board: renderedBoard,
    startGame,
    isPlaying,
  };
}
