import { Piece, Position } from "./State";

export const initial =
  "♜♞♝♛♚♝♞♜" +
  "♟♟♟♟♟♟♟♟" +
  "        " +
  "        " +
  "        " +
  "        " +
  "♙♙♙♙♙♙♙♙" +
  "♖♘♗♕♔♗♘♖";

export const rookKing =
  "    ♚   " +
  "        " +
  "   ♔ ♖  " +
  "        " +
  "        " +
  "        " +
  "        " +
  "        ";

export class Board {
  private pieceList: (Piece | null)[];

  constructor(public boardString: String) {
    // TODO Check only pieces or spaces are in the string
    this.pieceList = boardString
      .split("")
      .map((p) => (p === " " ? null : p)) as (Piece | null)[];
  }

  public set(pos: Position, piece: Piece): void {
    if (pos.x < 0 || pos.x > 7 || pos.y < 0 || pos.y > 7) {
      throw new Error("Invalid position");
    }
    this.pieceList[pos.y * 8 + pos.x] = piece;
  }

  public get(pos: Position): Piece | null {
    if (pos.x < 0 || pos.x > 7 || pos.y < 0 || pos.y > 7) {
      return null;
    }
    return this.pieceList[pos.y * 8 + pos.x];
  }

  public clear(pos: Position): void {
    this.pieceList[pos.y * 8 + pos.x] = null;
  }

  public export() {
    let output = "";
    for (let i = 0; i < 64; i++) {
      output += this.pieceList[i] || " ";
      if (i % 8 === 7) output += "\n";
    }
    return output;
  }

  public clone() {
    const boardString = this.export().replace(/\n/g, "");
    return new Board(boardString);
  }

  public forEachPiece(callback: (pos: Position, piece: Piece) => void): void {
    for (let i = 0; i < 64; i++) {
      const y = Math.floor(i / 8);
      const x = i % 8;
      const piece = this.pieceList[i];
      if (piece !== null) {
        callback({ x, y }, piece);
      }
    }
  }

  public findPiece(
    callback: (pos: Position, piece: Piece) => boolean
  ): Position | null {
    for (let i = 0; i < 64; i++) {
      const y = Math.floor(i / 8);
      const x = i % 8;
      const piece = this.pieceList[i];
      if (piece !== null && callback({ x, y }, piece)) {
        return { x, y };
      }
    }
    return null;
  }
}
