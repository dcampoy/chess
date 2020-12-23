import { Position, State } from "./State";

class Engine {
  availableMoves: { from: Position; to: Position }[];

  constructor(public state: State) {
    this.availableMoves = state.allPossibleMoves();
  }

  score(from: Position, to: Position) {
    if (
      this.availableMoves.find(
        (move) =>
          move.from.x === from.x &&
          move.from.y === from.y &&
          move.to.x === to.x &&
          move.to.y === to.y
      )
    ) {
      return -this.state.move(from, to).score() - this.state.score();
    }
    return null;
  }

  suggestMove(): { from: Position; to: Position } | null {
    let bestMove: { from: Position; to: Position } | null = null;
    let maxScore: number | null = null;
    this.availableMoves.forEach((move) => {
      const score = this.score(move.from, move.to);

      if (score === null) return;

      if (maxScore === null || score > maxScore) {
        maxScore = score;
        bestMove = move;
      }
    });
    return bestMove;
  }
}

export default Engine;
