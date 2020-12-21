import { Piece } from "../engine/State";

const backgroundColor = ["#795548", "#FFECB3"];

const pieceMap: { [K in Piece]: Piece } = {
  "♙": "♟︎",
  "♖": "♜",
  "♘": "♞",
  "♗": "♝",
  "♕": "♛",
  "♔": "♚",
  "♟︎": "♟︎",
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
  selected,
  selectable,
  onSelect,
}: {
  x: number;
  y: number;
  content: Piece | null;
  selected: boolean;
  selectable: boolean;
  onSelect: (x: number, y: number) => void;
}) {
  function handleClick() {
    onSelect(x, y);
  }

  const color = content && "♟︎♜♞♝♛♚".includes(content) ? "black" : "white";
  const piece = content ? pieceMap[content] : "";

  return (
    <div
      style={{
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
      {piece || (selectable ? "•" : "")}
    </div>
  );
}

export default Cell;
