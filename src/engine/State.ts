export interface Position {
  x: number;
  y: number;
}

export type Piece = typeof blackPieces[number] | typeof whitePieces[number];

export const blackPieces = ["♟︎", "♜", "♞", "♝", "♛", "♚"] as const;

export const whitePieces = ["♙", "♖", "♘", "♗", "♕", "♔"] as const;

export class State {
  constructor(
    public board: (Piece | "")[],
    public turn: "white" | "black",
    public enPassant: Position | null,
    public rightCastlingPossible: boolean,
    public leftCastlingPossible: boolean
  ) {}

  private pieceAt(pos: Position) {
    if (pos.x < 0 || pos.x > 7 || pos.y < 0 || pos.y > 7) {
      return "";
    }
    return this.board[pos.y * 8 + pos.x];
  }

  toMatrix(): (Piece | "")[][] {
    const rows = [];
    for (let i = 0; i < 64; i += 8) {
      rows.push(this.board.slice(i, i + 8));
    }
    return rows;
  }

  move(from: Position, to: Position): State {
    const movedPiece = this.pieceAt(from);

    // Detecting en-passant
    let enPassant = null;
    if (movedPiece === "♟︎" && from.y === 1 && to.y === 3) {
      enPassant = { x: from.x, y: 2 };
    }

    if (movedPiece === "♙" && from.y === 6 && to.y === 4) {
      enPassant = { x: from.x, y: 5 };
    }

    const board = [...this.board];

    board[to.y * 8 + to.x] = board[from.y * 8 + from.x];
    board[from.y * 8 + from.x] = "";

    // Executing en-passant
    if (
      movedPiece === "♟︎" &&
      to.x === this.enPassant?.x &&
      to.y === this.enPassant.y
    ) {
      board[(to.y - 1) * 8 + to.x] = "";
    }
    if (
      movedPiece === "♙" &&
      to.x === this.enPassant?.x &&
      to.y === this.enPassant.y
    ) {
      board[(to.y + 1) * 8 + to.x] = "";
    }

    // Pawn to Queen
    if (movedPiece === "♟︎" && to.y === 7) {
      board[to.y * 8 + to.x] = "♛";
    }

    if (movedPiece === "♙" && to.y === 0) {
      board[to.y * 8 + to.x] = "♕";
    }

    const castlingLine = this.turn === "black" ? 0 : 7;

    if (
      this.rightCastlingPossible &&
      from.x === 4 &&
      from.y === castlingLine &&
      to.x === 6 &&
      to.y === castlingLine
    ) {
      board[castlingLine * 8 + 5] = board[castlingLine * 8 + 7];
      board[castlingLine * 8 + 7] = "";
    }

    if (
      this.leftCastlingPossible &&
      from.x === 4 &&
      from.y === castlingLine &&
      to.x === 2 &&
      to.y === castlingLine
    ) {
      board[castlingLine * 8 + 3] = board[castlingLine * 8];
      board[castlingLine * 8] = "";
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

  isEnemy(piece: Piece | "") {
    if (piece === "") {
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

  canAttackPosition(pos: Position) {
    return (
      this.allPossibleMoves().find(
        ({ to }) => to.x === pos.x && to.y === pos.y
      ) !== undefined
    );
  }

  canCaptureEnemyKing() {
    const kingPiece = this.turn === "black" ? "♔" : "♚";
    const kingPos = this.find(
      (pos) => this.pieceAt(pos) === kingPiece
    ) as Position;

    return this.canAttackPosition(kingPos);
  }

  allPossibleMoves() {
    return this.board.reduce((acc, piece, indexedPos) => {
      if (piece === "" || this.isEnemy(piece)) return acc;
      const x = indexedPos % 8;
      const y = (indexedPos - x) / 8;
      acc = [
        ...acc,
        ...this.validMoves({ x, y }, true).map((to) => ({
          from: { x, y },
          to,
        })),
      ];
      return acc;
    }, [] as { from: Position; to: Position }[]);
  }

  inCheck() {
    const hypotheticalNoMove = new State(
      this.board,
      this.turn === "black" ? "white" : "black",
      null,
      this.rightCastlingPossible,
      this.leftCastlingPossible
    );
    return hypotheticalNoMove.canCaptureEnemyKing();
  }

  inCheckmate() {
    return (
      this.allPossibleMoves().find(
        ({ from, to }) => !this.move(from, to).canCaptureEnemyKing()
      ) === undefined
    );
  }

  validMoves(from: Position, allowKingDefenceless: boolean): Position[] {
    const piece = this.pieceAt(from);
    const moves: Position[] = [];

    if (piece === "" || this.isEnemy(piece)) {
      return moves;
    }

    if (piece === "♟︎" || piece === "♙") {
      const dir = piece === "♟︎" ? 1 : -1;

      if (!this.pieceAt({ x: from.x, y: from.y + dir })) {
        moves.push({ x: from.x, y: from.y + dir });
      }
      if ((piece === "♟︎" && from.y === 1) || (piece === "♙" && from.y === 6)) {
        if (this.pieceAt({ x: from.x, y: from.y + 2 * dir }) === "") {
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
        piece === "♟︎" &&
        from.y === 5 &&
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

      return validMoves.filter((p): p is Position => p !== null);
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

      const hypotheticalNoMove = new State(
        this.board,
        this.turn === "black" ? "white" : "black",
        null,
        this.rightCastlingPossible,
        this.leftCastlingPossible
      );

      // Right castling
      const castlingRow = piece === "♚" ? 0 : 7;
      if (
        this.rightCastlingPossible &&
        from.x === 4 &&
        from.y === castlingRow &&
        this.pieceAt({ x: 5, y: castlingRow }) === "" &&
        this.pieceAt({ x: 6, y: castlingRow }) === "" &&
        !hypotheticalNoMove.canAttackPosition({ x: 4, y: castlingRow }) &&
        !hypotheticalNoMove.canAttackPosition({ x: 5, y: castlingRow }) &&
        !hypotheticalNoMove.canAttackPosition({ x: 6, y: castlingRow })
      ) {
        moves.push({ x: 6, y: castlingRow });
      }

      // Left castling
      if (
        this.leftCastlingPossible &&
        from.x === 4 &&
        from.y === castlingRow &&
        this.pieceAt({ x: 1, y: castlingRow }) === "" &&
        this.pieceAt({ x: 2, y: castlingRow }) === "" &&
        this.pieceAt({ x: 3, y: castlingRow }) === "" &&
        !hypotheticalNoMove.canAttackPosition({ x: 2, y: castlingRow }) &&
        !hypotheticalNoMove.canAttackPosition({ x: 3, y: castlingRow }) &&
        !hypotheticalNoMove.canAttackPosition({ x: 4, y: castlingRow })
      ) {
        moves.push({ x: 2, y: castlingRow });
      }
    }

    // Filter moves out of the board
    return moves
      .filter((to) => to.x >= 0 && to.x <= 7 && to.y >= 0 && to.y <= 7)
      .filter(
        (to) =>
          allowKingDefenceless || !this.move(from, to).canCaptureEnemyKing()
      );
  }
}
