import React, { useState } from "react";
import {
  Board as BoardState,
  initial,
  rookKing,
  twoBishopKing,
} from "../engine/Board";
import Engine from "../engine/Engine";
import { Move, Position, State } from "../engine/State";
import Cell from "./Cell";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const rookKingState = new State(
  new BoardState(rookKing),
  "white",
  null,
  false,
  false
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const defaultState = new State(
  new BoardState(initial),
  "white",
  null,
  true,
  true
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const twoBishopKingState = new State(
  new BoardState(twoBishopKing),
  "white",
  null,
  false,
  false
);

const initialState = defaultState;

function Board() {
  const [state, setState] = useState<State>(initialState);
  const [selected, setSelected] = useState<Position | null>(null);

  const validMoves = selected ? state.validMoves(selected) : [];

  const inCheck = state.inCheck();
  const inCheckmate = inCheck && state.inCheckmate();
  const inStalemate = state.inStalemate();

  const engine = new Engine(state);
  const score = state.score();

  const suggestedMove = engine.suggestMove();

  const movePiece = (move: Move) => {
    const newState = state.move(move.from, move.to);
    setState(newState);
    setSelected(null);
  };

  // A piece is selectable when it has at least one allowed move
  const isSelectable = (pos: Position) => state.validMoves(pos).length > 0;

  const isValidMove = (to: Position) =>
    validMoves.find((m) => m.x === to.x && m.y === to.y) !== undefined;

  const handleSelect = (pos: Position) => {
    if (!selected && isSelectable(pos)) {
      setSelected(pos);
    } else if (selected && isValidMove(pos)) {
      movePiece({ from: selected, to: pos });
    } else {
      setSelected(null);
    }
  };

  return (
    <>
      <div
        style={{
          margin: "30px auto",
          width: 640,
          height: 640,
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          fontSize: 72,
          border: "5px black solid",
        }}
      >
        {state.toMatrix().map((row, y) =>
          row.map((cellContent, x) => {
            const hasValidMoves = cellContent
              ? state.validMoves({ x, y }).length > 0
              : false;

            const selectable = selected ? isValidMove({ x, y }) : hasValidMoves;

            const moveScore = selected
              ? engine.score(selected, { x, y })
              : null;

            const isSuggested = selected
              ? suggestedMove?.from.x === selected.x &&
                suggestedMove?.from.y === selected.y &&
                x === suggestedMove.to.x &&
                y === suggestedMove.to.y
              : suggestedMove?.from.x === x && suggestedMove?.from.y === y;

            return (
              <Cell
                key={`${x} ${y}`}
                x={x}
                y={y}
                content={cellContent ? cellContent : null}
                selected={selected?.x === x && selected?.y === y}
                selectable={selectable}
                validMove={isValidMove({ x, y })}
                suggested={isSuggested}
                onSelect={(x, y) => handleSelect({ x, y })}
                label={moveScore?.toString() || ""}
              />
            );
          })
        )}
      </div>
      <div
        style={{
          margin: "0 auto",
          width: 640,
        }}
      >
        <p>
          {inCheckmate
            ? "Checkmate"
            : inCheck
            ? "Check"
            : inStalemate
            ? "Stalemate"
            : ""}
        </p>
        <p>Score: {score}</p>
      </div>
    </>
  );
}

export default Board;
