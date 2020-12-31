import React, { useState } from "react";
import { Board as BoardState, initial } from "../engine/Board";
import Engine from "../engine/Engine";
import { Position, State } from "../engine/State";
import Cell from "./Cell";

// prettier-ignore
const initialState = new State([
  "♜","♞","♝","♛","♚","♝","♞","♜",
  "♟","♟","♟","♟","♟","♟","♟","♟",
  "","","","","","","","",
  "","","","","","","","",
  "","","","","","","","",
  "","","","","","","","",
  "♙","♙","♙","♙","♙","♙","♙","♙",
  "♖","♘","♗","♕","♔","♗","♘","♖",
], new BoardState(initial),  "white", null, true, true)

// const initialState = new State([
//   "","","","","♚","","","",
//   "","","","","","","","",
//   "","","","","","♔","","",
//   "","","","","","","","",
//   "","","","","","","","",
//   "","","","","","","","",
//   "","","","","","","","",
//   "","","","♕","","","","",
// ], "white", null, false, false)

function Board() {
  const [state, setState] = useState<State>(initialState);
  const [selected, setSelected] = useState<Position | null>(null);

  const content = state.toMatrix();
  const validMoves = selected ? state.validMoves(selected, false) : [];

  const inCheck = state.inCheck();
  const inCheckmate = inCheck && state.inCheckmate();
  const inStalemate = state.inStalemate();

  const score = state.score();

  const engine = new Engine(state);
  const suggestedMove = engine.suggestMove();

  const handleSelect = (pos: Position) => {
    if (!selected && state.validMoves(pos, false).length > 0) {
      setSelected(pos);
    } else if (
      selected &&
      validMoves.find((m) => m.x === pos.x && m.y === pos.y)
    ) {
      const newState = state.move(selected, pos);
      setState(newState);
      setSelected(null);
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
        {content.map((row, y) =>
          row.map((cellContent, x) => {
            const isValidMove =
              validMoves.find((m) => m.x === x && m.y === y) !== undefined;
            const hasValidMoves = cellContent
              ? state.validMoves({ x, y }, false).length > 0
              : false;
            const selectable = selected ? isValidMove : hasValidMoves;
            const moveScore =
              selected && isValidMove
                ? engine.score({ ...selected }, { x, y })
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
                validMove={isValidMove}
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
