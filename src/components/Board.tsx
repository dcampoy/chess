import React, { useState } from "react";
import { Position, State } from "../engine/State";
import Cell from "./Cell";

// prettier-ignore
// const initialState = new State([
//   "♜","♞","♝","♛","♚","♝","♞","♜",
//   "♟︎","♟︎","♟︎","♟︎","♟︎","♟︎","♟︎","♟︎",
//   "","","","","","","","",
//   "","","","","","","","",
//   "","","","","","","","",
//   "","","","","","","","",
//   "♙","♙","♙","♙","♙","♙","♙","♙",
//   "♖","♘","♗","♕","♔","♗","♘","♖",
// ], "white", null, true, true)

const initialState = new State([
  "","","","","♚","","","",
  "","","","","","","","",
  "","","","","","♔","","",
  "","","","","","","","",
  "","","","","","","","",
  "","","","","","","","",
  "","","","","","","","",
  "","","","♕","","","","",
], "white", null, false, false)

function Board() {
  const [state, setState] = useState<State>(initialState);
  const [selected, setSelected] = useState<Position | null>(null);

  const content = state.toMatrix();
  const validMoves = selected ? state.validMoves(selected, false) : [];

  const inCheck = state.inCheck();
  const inCheckmate = inCheck && state.inCheckmate();
  const inStalemate = state.inStalemate();

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
            const hasValidMoves = state.validMoves({ x, y }, false).length > 0;
            const selectable = selected ? isValidMove : hasValidMoves;
            return (
              <Cell
                key={`${x} ${y}`}
                x={x}
                y={y}
                content={cellContent ? cellContent : null}
                selected={selected?.x === x && selected?.y === y}
                selectable={selectable}
                validMove={isValidMove}
                onSelect={(x, y) => handleSelect({ x, y })}
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
        {inCheckmate
          ? "Checkmate"
          : inCheck
          ? "Check"
          : inStalemate
          ? "Stalemate"
          : ""}
      </div>
    </>
  );
}

export default Board;
