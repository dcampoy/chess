import { Piece } from "../engine/State";

const backgroundColor = ["#FFECB3", "#795548"];

const pieceMap: { [K in Piece]: Piece } = {
  "♙": "♟",
  "♖": "♜",
  "♘": "♞",
  "♗": "♝",
  "♕": "♛",
  "♔": "♚",
  "♟": "♟",
  "♜": "♜",
  "♞": "♞",
  "♝": "♝",
  "♛": "♛",
  "♚": "♚",
};

function Cell({
  x,
  y,
  content,
  selectable,
  suggested,
  onSelect,
  validMove,
  label,
}: {
  x: number;
  y: number;
  content: Piece | null;
  selected: boolean;
  selectable: boolean;
  suggested: boolean;
  validMove: boolean;
  onSelect: (x: number, y: number) => void;
  label: string | null;
}) {
  function handleClick() {
    onSelect(x, y);
  }

  const color = content && "♟︎♜♞♝♛♚".includes(content) ? "black" : "white";
  const piece = content ? pieceMap[content] : "";

  return (
    <div
      style={{
        position: "relative",
        userSelect: "none",
        backgroundColor: backgroundColor[(x + y) % 2],
        justifyContent: "center",
        alignItems: "center",
        display: "flex",
        height: 80,
        width: 80,
        color,
        cursor: selectable ? "pointer" : "default",
        textShadow:
          color === "white" ? "0px 0px 5px #49342c" : "0px 0px 5px white",
      }}
      onClick={handleClick}
    >
      {piece}
      {validMove || suggested ? (
        <span
          style={{
            color: "white",
            textShadow: "0px 0px 5px #49342c",
            position: "absolute",
          }}
        >
          {suggested ? "•" : "·"}
        </span>
      ) : (
        ""
      )}
      {label && (
        <div
          style={{
            fontSize: 12,
            color: "white",
            textShadow: "none",
            position: "absolute",
            bottom: 10,
            padding: "0.2em",
            backgroundColor: "#0008",
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

export default Cell;
