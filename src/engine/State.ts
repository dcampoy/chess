export interface Position {
  x: number;
  y: number;
}

export type Piece = typeof blackPieces[number] | typeof whitePieces[number];

export const blackPieces = ["♟︎", "♜", "♞", "♝", "♛", "♚"] as const;

export const whitePieces = ["♙", "♖", "♘", "♗", "♕", "♔"] as const;

export class State {
  constructor(public board: (Piece | "")[], public turn: "white" | "black") {}

  private pieceAt(pos: Position) {
    if (pos.x < 0 || pos.x > 7 || pos.y < 0 || pos.y > 7) {
      return "";
    }
    return this.board[pos.y * 8 + pos.x];
  }

  render(): (Piece | "")[][] {
    const rows = [];
    for (let i = 0; i < 64; i += 8) {
      rows.push(this.board.slice(i, i + 8));
    }
    return rows;
  }

  move(from: Position, to: Position): State {
    const board = [...this.board];
    board[to.y * 8 + to.x] = board[from.y * 8 + from.x];
    board[from.y * 8 + from.x] = "";
    const turn = this.turn === "black" ? "white" : "black";
    return new State(board, turn);
  }

  isEnemy(piece: Piece | "") {
    if (piece === "") {
      return false;
    }
    const enemyPieces = this.turn === "black" ? whitePieces : blackPieces;
    return (enemyPieces as readonly string[]).includes(piece);
  }

  validMoves(from: Position): Position[] {
    const piece = this.pieceAt(from);
    const moves: Position[] = [];

    if (piece === "" || this.isEnemy(piece)) {
      return moves;
    }

    if (piece === "♙") {
      if (!this.pieceAt({ x: from.x, y: from.y - 1 })) {
        moves.push({ x: from.x, y: from.y - 1 });
      }
      if (from.y === 6) {
        if (this.pieceAt({ x: from.x, y: from.y - 2 }) === "") {
          moves.push({ x: from.x, y: from.y - 2 });
        }
      }
      if (this.isEnemy(this.pieceAt({ x: from.x - 1, y: from.y - 1 }))) {
        moves.push({ x: from.x - 1, y: from.y - 1 });
      }
      if (this.isEnemy(this.pieceAt({ x: from.x + 1, y: from.y - 1 }))) {
        moves.push({ x: from.x + 1, y: from.y - 1 });
      }
    }

    if (piece === "♟︎") {
      if (!this.pieceAt({ x: from.x, y: from.y + 1 })) {
        moves.push({ x: from.x, y: from.y + 1 });
      }
      if (from.y === 1) {
        if (this.pieceAt({ x: from.x, y: from.y + 2 }) === "") {
          moves.push({ x: from.x, y: from.y + 2 });
        }
      }
      if (this.isEnemy(this.pieceAt({ x: from.x - 1, y: from.y + 1 }))) {
        moves.push({ x: from.x - 1, y: from.y + 1 });
      }
      if (this.isEnemy(this.pieceAt({ x: from.x + 1, y: from.y + 1 }))) {
        moves.push({ x: from.x + 1, y: from.y + 1 });
      }
    }
    return moves;
  }
}
