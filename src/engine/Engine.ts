import { Position, State } from "./State";

const scoreCache = new Map<String, number>();

class Engine {
  availableMoves: { from: Position; to: Position }[];

  constructor(public state: State) {
    this.availableMoves = state.allPossibleMoves();
  }

  private moveIsValid(from: Position, to: Position) {
    return this.availableMoves.find(
      (move) =>
        move.from.x === from.x &&
        move.from.y === from.y &&
        move.to.x === to.x &&
        move.to.y === to.y
    );
  }

  // Naive
  private naive(from: Position, to: Position) {
    const cacheKey = `${from.x},${from.y} -> ${to.x},${to.y}`;
    const cachedScore = scoreCache.get(cacheKey);
    if (cachedScore) return cachedScore;

    const score = -this.state.move(from, to).score() - this.state.score();
    scoreCache.set(cacheKey, score);
  }

  // In this implementation, because the state.score is always relative to the player instead of
  // global, the code for min and for max are the same!
  minimax(state: State, plies: number): number {
    const cacheKey = `${state.stateCacheKey} depth:${plies}`;
    const cachedScore = scoreCache.get(cacheKey);
    if (cachedScore) return cachedScore;
    if (plies === 0 || state.inCheckmate() || state.inStalemate()) {
      return -state.score();
    }
    const possibleMoves = state.allPossibleMoves();
    const score = -possibleMoves
      .map(({ from, to }) => this.minimax(state.move(from, to), plies - 1))
      .reduce((acc, v) => Math.max(acc, v));
    scoreCache.set(cacheKey, score);
    return score;
  }

  score(from: Position, to: Position) {
    if (!this.moveIsValid(from, to)) return null;
    return this.minimax(this.state.move(from, to), 3);
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
