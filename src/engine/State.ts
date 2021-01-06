import { Board } from "./Board";

export interface Position {
  x: number;
  y: number;
}

export interface Move {
  from: Position;
  to: Position;
}

export type Piece = typeof blackPieces[number] | typeof whitePieces[number];

export const blackPieces = ["♟", "♜", "♞", "♝", "♛", "♚"] as const;

export const whitePieces = ["♙", "♖", "♘", "♗", "♕", "♔"] as const;

const allPosibleMovesCache = new WeakMap<State, Move[]>();

export class State {
  public stateCacheKey: String;

  constructor(
    public board: Board,
    public turn: "white" | "black",
    public enPassant: Position | null,
    public rightCastlingPossible: boolean,
    public leftCastlingPossible: boolean
  ) {
    this.stateCacheKey = this.buildStateKey(
      board,
      turn,
      enPassant,
      rightCastlingPossible,
      leftCastlingPossible
    );
  }

  private buildStateKey(
    board: Board,
    turn: "white" | "black",
    enPassant: Position | null,
    rightCastlingPossible: boolean,
    leftCastlingPossible: boolean
  ) {
    return (
      board.export() +
      `${turn} ${enPassant?.x || "-"},${enPassant?.x || "-"} ${
        leftCastlingPossible ? "l" : "-"
      } ${rightCastlingPossible ? "r" : "-"}`
    );
  }

  private pieceAt(pos: Position): Piece | null {
    return this.board.get(pos);
  }

  toMatrix(): (Piece | "")[][] {
    const rows = this.board.export().split("\n");
    return rows.map((row) => {
      return row.split("").map((p) => (p === " " ? "" : p)) as (Piece | "")[];
    });
  }

  move(from: Position, to: Position): State {
    const movedPiece = this.pieceAt(from);
    if (!movedPiece) {
      console.error("Attempt to move a non-existing piece");
      return this;
    }

    // Detecting en-passant
    let enPassant = null;
    if (movedPiece === "♟" && from.y === 1 && to.y === 3) {
      enPassant = { x: from.x, y: 2 };
    }

    if (movedPiece === "♙" && from.y === 6 && to.y === 4) {
      enPassant = { x: from.x, y: 5 };
    }

    const board = this.board.clone();

    board.set(to, movedPiece);
    board.clear(from);

    // Executing en-passant
    if (
      movedPiece === "♟" &&
      to.x === this.enPassant?.x &&
      to.y === this.enPassant.y
    ) {
      board.clear({ x: to.x, y: to.y - 1 });
    }
    if (
      movedPiece === "♙" &&
      to.x === this.enPassant?.x &&
      to.y === this.enPassant.y
    ) {
      board.clear({ x: to.x, y: to.y + 1 });
    }

    // Pawn to Queen
    if (movedPiece === "♟" && to.y === 7) {
      board.set(to, "♛");
    }

    if (movedPiece === "♙" && to.y === 0) {
      board.set(to, "♕");
    }

    const castlingLine = this.turn === "black" ? 0 : 7;

    if (
      this.rightCastlingPossible &&
      from.x === 4 &&
      from.y === castlingLine &&
      to.x === 6 &&
      to.y === castlingLine
    ) {
      board.set({ x: 5, y: castlingLine }, this.turn === "black" ? "♜" : "♖");
      board.clear({ x: 7, y: castlingLine });
    }

    if (
      this.leftCastlingPossible &&
      from.x === 4 &&
      from.y === castlingLine &&
      to.x === 2 &&
      to.y === castlingLine
    ) {
      board.set({ x: 3, y: castlingLine }, this.turn === "black" ? "♜" : "♖");
      board.clear({ x: 0, y: castlingLine });
    }

    const rightCastlingPossible =
      this.rightCastlingPossible &&
      !(from.x === 4 && from.y === castlingLine) &&
      !(from.x === 7 && from.y === castlingLine);

    const leftCastlingPossible =
      this.rightCastlingPossible &&
      !(from.x === 4 && from.y === castlingLine) &&
      !(from.x === 0 && from.y === castlingLine);

    const turn = this.turn === "black" ? "white" : "black";

    return new State(
      board,
      turn,
      enPassant,
      rightCastlingPossible,
      leftCastlingPossible
    );
  }

  isEnemy(piece: Piece | null) {
    if (!piece) {
      return false;
    }
    const enemyPieces = this.turn === "black" ? whitePieces : blackPieces;
    return (enemyPieces as readonly string[]).includes(piece);
  }

  find(predicate: (pos: Position) => boolean) {
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        if (predicate({ x, y })) return { x, y };
      }
    }
  }

  canCaptureEnemyKing() {
    const kingPiece = this.turn === "black" ? "♔" : "♚";
    const kingPos = this.find((pos) => this.pieceAt(pos) === kingPiece);

    if (!kingPos) throw new Error("Vive le republique!");

    return (
      this.allAttackedPositionsByMe().find(
        (target) => target.x === kingPos.x && target.y === kingPos.y
      ) !== undefined
    );
  }

  allPossibleMoves() {
    const cachedMoves = allPosibleMovesCache.get(this);
    if (cachedMoves) {
      return cachedMoves;
    }

    const possibleMoves: Move[] = [];
    this.board.forEachPiece((from, piece) => {
      if (this.isEnemy(piece)) return;
      this.validMoves(from).forEach((to) => {
        possibleMoves.push({ from, to });
      });
    });

    allPosibleMovesCache.set(this, possibleMoves);

    return possibleMoves;
  }

  allAttackedPositionsByMe() {
    const attackedPositions: Position[] = [];
    this.board.forEachPiece((from, piece) => {
      if (this.isEnemy(piece)) return;
      this.attackedPositions(piece, from).forEach((pos) =>
        attackedPositions.push(pos)
      );
    });
    return attackedPositions;
  }

  allAttackedPositionsByTheEnemy() {
    const attackedPositions: Position[] = [];
    this.board.forEachPiece((from, piece) => {
      if (!this.isEnemy(piece)) return;
      this.attackedPositions(piece, from).forEach((pos) =>
        attackedPositions.push(pos)
      );
    });
    return attackedPositions;
  }

  inCheck() {
    const kingPiece = this.turn === "black" ? "♚" : "♔";
    const kingPos = this.board.findPiece((_, piece) => piece === kingPiece);

    return (
      this.allAttackedPositionsByTheEnemy().find(
        (target) => target.x === kingPos?.x && target.y === kingPos.y
      ) !== undefined
    );
  }

  hasNoPossibleMoves() {
    const canMoveAPawn =
      this.board.findPiece((from, piece) => {
        if (this.isEnemy(piece) || (piece !== "♟" && piece !== "♙"))
          return false;
        return this.validMoves(from).length > 0;
      }) !== null;

    if (canMoveAPawn) return false;

    const canMoveAnyOtherPiece =
      this.board.findPiece((from, piece) => {
        if (this.isEnemy(piece) || piece === "♟" || piece === "♙") return false;
        return this.validMoves(from).length > 0;
      }) !== null;

    return !canMoveAnyOtherPiece;
  }

  inCheckmate() {
    return this.inCheck() && this.hasNoPossibleMoves();
  }

  inStalemate() {
    return !this.inCheck() && this.hasNoPossibleMoves();
  }

  attackedPositions(piece: Piece, from: Position): Position[] {
    const attackedPositions: Position[] = [];
    if (piece === "♟" || piece === "♙") {
      const dir = piece === "♟" ? 1 : -1;
      attackedPositions.push({ x: from.x - 1, y: from.y + dir });
      attackedPositions.push({ x: from.x + 1, y: from.y + dir });
    }

    if (piece === "♜" || piece === "♖") {
      // prettier-ignore
      const vectors = [
        [-1,  0],
        [ 0, -1],
        [ 0,  1],
        [ 1,  0], 
      ]

      for (let vector of vectors) {
        for (
          let x = from.x + vector[0], y = from.y + vector[1];
          x >= 0 && x <= 7 && y >= 0 && y <= 7;
          x += vector[0], y += vector[1]
        ) {
          const piece = this.pieceAt({ x, y });
          attackedPositions.push({ x, y });
          if (piece) {
            break;
          }
        }
      }
    }

    if (piece === "♞" || piece === "♘") {
      attackedPositions.push({ x: from.x + 1, y: from.y - 2 });
      attackedPositions.push({ x: from.x - 1, y: from.y + 2 });
      attackedPositions.push({ x: from.x - 1, y: from.y - 2 });
      attackedPositions.push({ x: from.x + 1, y: from.y + 2 });
      attackedPositions.push({ x: from.x - 2, y: from.y - 1 });
      attackedPositions.push({ x: from.x + 2, y: from.y - 1 });
      attackedPositions.push({ x: from.x - 2, y: from.y + 1 });
      attackedPositions.push({ x: from.x + 2, y: from.y + 1 });
    }

    if (piece === "♝" || piece === "♗") {
      // prettier-ignore
      const vectors = [
        [-1, -1],
        [ 1, -1], 
        [-1,  1],
        [ 1,  1]
      ]

      for (let vector of vectors) {
        for (
          let x = from.x + vector[0], y = from.y + vector[1];
          x >= 0 && x <= 7 && y >= 0 && y <= 7;
          x += vector[0], y += vector[1]
        ) {
          const piece = this.pieceAt({ x, y });
          attackedPositions.push({ x, y });
          if (piece) {
            break;
          }
        }
      }
    }

    if (piece === "♛" || piece === "♕") {
      // prettier-ignore
      const vectors = [
        [-1, -1],
        [-1,  0],
        [-1,  1],
        [ 0, -1],
        [ 0,  1],
        [ 1, -1], 
        [ 1,  0], 
        [ 1,  1]
      ]

      for (let vector of vectors) {
        for (
          let x = from.x + vector[0], y = from.y + vector[1];
          x >= 0 && x <= 7 && y >= 0 && y <= 7;
          x += vector[0], y += vector[1]
        ) {
          const piece = this.pieceAt({ x, y });
          attackedPositions.push({ x, y });
          if (piece) {
            break;
          }
        }
      }
    }

    if (piece === "♚" || piece === "♔") {
      // prettier-ignore
      const vectors = [
        [-1, -1],
        [-1,  0],
        [-1,  1],
        [ 0, -1],
        [ 0,  1],
        [ 1, -1], 
        [ 1,  0], 
        [ 1,  1]
      ]

      for (let vector of vectors) {
        const x = from.x + vector[0];
        const y = from.y + vector[1];
        attackedPositions.push({ x, y });
      }
    }

    return attackedPositions;
  }

  validMoves(from: Position): Position[] {
    const piece = this.pieceAt(from);
    const moves: Position[] = [];

    if (!piece || this.isEnemy(piece)) {
      return [];
    }

    if (piece === "♟" || piece === "♙") {
      const dir = piece === "♟" ? 1 : -1;

      if (!this.pieceAt({ x: from.x, y: from.y + dir })) {
        moves.push({ x: from.x, y: from.y + dir });
      }
      if ((piece === "♟" && from.y === 1) || (piece === "♙" && from.y === 6)) {
        if (
          !this.pieceAt({ x: from.x, y: from.y + 1 * dir }) &&
          !this.pieceAt({ x: from.x, y: from.y + 2 * dir })
        ) {
          moves.push({ x: from.x, y: from.y + 2 * dir });
        }
      }
      if (this.isEnemy(this.pieceAt({ x: from.x - 1, y: from.y + dir }))) {
        moves.push({ x: from.x - 1, y: from.y + dir });
      }
      if (this.isEnemy(this.pieceAt({ x: from.x + 1, y: from.y + dir }))) {
        moves.push({ x: from.x + 1, y: from.y + dir });
      }

      if (
        piece === "♟" &&
        from.y === 4 &&
        this.enPassant &&
        (from.x === this.enPassant.x + 1 || from.x === this.enPassant.x - 1)
      ) {
        moves.push(this.enPassant);
      }

      if (
        piece === "♙" &&
        from.y === 3 &&
        this.enPassant &&
        (from.x === this.enPassant.x + 1 || from.x === this.enPassant.x - 1)
      ) {
        moves.push(this.enPassant);
      }
    }

    if (piece === "♜" || piece === "♖") {
      // To left
      for (let x = from.x - 1; x >= 0; x--) {
        if (!this.pieceAt({ x, y: from.y })) {
          moves.push({ x, y: from.y });
        } else if (this.isEnemy(this.pieceAt({ x, y: from.y }))) {
          moves.push({ x, y: from.y });
          break;
        } else {
          break;
        }
      }

      // To top
      for (let y = from.y - 1; y >= 0; y--) {
        if (!this.pieceAt({ x: from.x, y })) {
          moves.push({ x: from.x, y });
        } else if (this.isEnemy(this.pieceAt({ x: from.x, y }))) {
          moves.push({ x: from.x, y });
          break;
        } else {
          break;
        }
      }

      // To right
      for (let x = from.x + 1; x <= 7; x++) {
        if (!this.pieceAt({ x, y: from.y })) {
          moves.push({ x, y: from.y });
        } else if (this.isEnemy(this.pieceAt({ x, y: from.y }))) {
          moves.push({ x, y: from.y });
          break;
        } else {
          break;
        }
      }

      // To down
      for (let y = from.y + 1; y <= 7; y++) {
        if (!this.pieceAt({ x: from.x, y })) {
          moves.push({ x: from.x, y });
        } else if (this.isEnemy(this.pieceAt({ x: from.x, y }))) {
          moves.push({ x: from.x, y });
          break;
        } else {
          break;
        }
      }
    }

    if (piece === "♞" || piece === "♘") {
      const potentialMoves: Position[] = [
        { x: from.x - 1, y: from.y - 2 },
        { x: from.x + 1, y: from.y - 2 },
        { x: from.x - 1, y: from.y + 2 },
        { x: from.x + 1, y: from.y + 2 },

        { x: from.x - 2, y: from.y - 1 },
        { x: from.x + 2, y: from.y - 1 },
        { x: from.x - 2, y: from.y + 1 },
        { x: from.x + 2, y: from.y + 1 },
      ];

      const validMoves = potentialMoves.map((pos) => {
        const piece = this.pieceAt(pos);
        return !piece || this.isEnemy(piece) ? pos : null;
      });

      validMoves.forEach((p) => {
        if (p !== null) moves.push(p);
      });
    }

    if (piece === "♝" || piece === "♗") {
      // prettier-ignore
      const vectors = [
        [-1, -1],
        [ 1, -1], 
        [-1,  1],
        [ 1,  1]
      ]

      for (let vector of vectors) {
        for (
          let x = from.x + vector[0], y = from.y + vector[1];
          x >= 0 && x <= 7 && y >= 0 && y <= 7;
          x += vector[0], y += vector[1]
        ) {
          const piece = this.pieceAt({ x, y });
          if (!piece) {
            moves.push({ x, y });
          } else if (this.isEnemy(piece)) {
            moves.push({ x, y });
            break;
          } else {
            break;
          }
        }
      }
    }

    if (piece === "♛" || piece === "♕") {
      // prettier-ignore
      const vectors = [
        [-1, -1],
        [-1,  0],
        [-1,  1],
        [ 0, -1],
        [ 0,  1],
        [ 1, -1], 
        [ 1,  0], 
        [ 1,  1]
      ]

      for (let vector of vectors) {
        for (
          let x = from.x + vector[0], y = from.y + vector[1];
          x >= 0 && x <= 7 && y >= 0 && y <= 7;
          x += vector[0], y += vector[1]
        ) {
          const piece = this.pieceAt({ x, y });
          if (!piece) {
            moves.push({ x, y });
          } else if (this.isEnemy(piece)) {
            moves.push({ x, y });
            break;
          } else {
            break;
          }
        }
      }
    }

    if (piece === "♚" || piece === "♔") {
      // prettier-ignore
      const vectors = [
        [-1, -1],
        [-1,  0],
        [-1,  1],
        [ 0, -1],
        [ 0,  1],
        [ 1, -1], 
        [ 1,  0], 
        [ 1,  1]
      ]

      for (let vector of vectors) {
        const x = from.x + vector[0];
        const y = from.y + vector[1];
        const piece = this.pieceAt({ x, y });

        if (!piece) {
          moves.push({ x, y });
        } else if (this.isEnemy(piece)) {
          moves.push({ x, y });
        }
      }

      // Right castling
      const castlingRow = piece === "♚" ? 0 : 7;
      if (
        this.rightCastlingPossible &&
        from.x === 4 &&
        from.y === castlingRow &&
        !this.pieceAt({ x: 5, y: castlingRow }) &&
        !this.pieceAt({ x: 6, y: castlingRow }) &&
        !this.allAttackedPositionsByTheEnemy().find(
          (target) => [4, 5, 6].includes(target.x) && target.y === castlingRow
        )
      ) {
        moves.push({ x: 6, y: castlingRow });
      }

      // Left castling
      if (
        this.leftCastlingPossible &&
        from.x === 4 &&
        from.y === castlingRow &&
        !this.pieceAt({ x: 1, y: castlingRow }) &&
        !this.pieceAt({ x: 2, y: castlingRow }) &&
        !this.pieceAt({ x: 3, y: castlingRow }) &&
        !this.allAttackedPositionsByTheEnemy().find(
          (target) => [2, 3, 4].includes(target.x) && target.y === castlingRow
        )
      ) {
        moves.push({ x: 2, y: castlingRow });
      }
    }

    const validMoves = moves
      .filter((to) => to.x >= 0 && to.x <= 7 && to.y >= 0 && to.y <= 7)
      .filter((to) => !this.move(from, to).canCaptureEnemyKing());

    return validMoves;
  }

  score() {
    const capablanca: { [key: string]: number } = {
      "♟": 100,
      "♜": 500,
      "♞": 300,
      "♝": 300,
      "♛": 900,
      "♚": 0,
      "♙": 100,
      "♖": 500,
      "♘": 300,
      "♗": 300,
      "♕": 900,
      "♔": 0,
    };

    if (this.inStalemate()) {
      return 0;
    }

    if (this.inCheckmate()) {
      return -100000;
    }

    let score = 0;
    this.board.forEachPiece((pos, piece) => {
      if (capablanca[piece] === undefined) {
        throw new Error(`Unkown value for piece: ${piece}`);
      }
      score += this.isEnemy(piece) ? -capablanca[piece] : capablanca[piece];
    });

    score += this.allAttackedPositionsByMe().length;
    score -= this.allAttackedPositionsByTheEnemy().length;

    return score;
  }
}
