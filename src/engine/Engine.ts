import { Position, State } from "./State";

const scoreCache = new Map<String, [number, number]>();

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
    scoreCache.set(cacheKey, [score, 0]);
  }

  minimax(state: State, plies: number): number {
    const cachedScore = scoreCache.get(state.stateCacheKey);
    if (cachedScore && cachedScore[1] >= plies) return cachedScore[0];
    if (plies === 0 || state.inCheckmate() || state.inStalemate()) {
      scoreCache.set(state.stateCacheKey, [-state.score(), plies]);
      return -state.score();
    }
    const possibleMoves = state.allPossibleMoves();
    const score = -possibleMoves
      .map(({ from, to }) => this.minimax(state.move(from, to), plies - 1))
      .reduce((acc, v) => Math.max(acc, v));
    scoreCache.set(state.stateCacheKey, [score, plies]);
    return score;
  }

  // Similarly to minimax, always look to maximise because the score is relative to the player
  alphabeta(
    state: State,
    alpha: number | undefined,
    beta: number | undefined,
    plies: number
  ): number {
    // @ts-ignore
    window.stats = window.stats || { calls: 0, hit: 0, miss: 0 };

    // @ts-ignore
    window.stats.calls++;
    const cachedScore = scoreCache.get(state.stateCacheKey);
    if (cachedScore && cachedScore[1] >= plies) {
      // @ts-ignore
      window.stats.hit++;
      return cachedScore[0];
    }
    // @ts-ignore
    window.stats.miss++;

    if (plies === 0 || state.inCheckmate() || state.inStalemate()) {
      const score = -state.score() + plies;
      scoreCache.set(state.stateCacheKey, [score, plies]);
      return score;
    }

    let principalVariation = true;

    const possibleMoves: [State, number][] = state
      .allPossibleMoves()
      .map((move) => {
        const newState = state.move(move.from, move.to);
        return [newState, -newState.score() + plies];
      });

    possibleMoves.sort((a, b) => b[1] - a[1]);

    for (const [newState] of possibleMoves) {
      let score;
      if (!principalVariation) {
        score = this.alphabeta(
          newState,
          beta !== undefined ? -beta : undefined,
          alpha !== undefined ? -alpha : undefined,
          plies - 1
        );
      } else {
        score = this.alphabeta(
          newState,
          alpha !== undefined ? -alpha - 1 : undefined,
          alpha !== undefined ? -alpha : undefined,
          plies - 1
        );
        if (alpha !== undefined && score > alpha) {
          score = this.alphabeta(
            newState,
            beta !== undefined ? -beta : undefined,
            alpha !== undefined ? -alpha : undefined,
            plies - 1
          );
        }
      }

      if (score >= 100000) {
        // Checkmate
        scoreCache.set(state.stateCacheKey, [-score, plies]);
        return -score;
      }

      if (beta !== undefined && score >= beta) {
        scoreCache.set(state.stateCacheKey, [-beta, plies]);
        return -beta;
      }

      if (alpha === undefined || score > alpha) {
        alpha = score;
        principalVariation = false;
      }
    }

    const finalScore = alpha !== undefined ? -alpha : NaN;
    scoreCache.set(state.stateCacheKey, [finalScore, plies]);
    return finalScore;
  }

  score(from: Position, to: Position): number | null {
    if (!this.moveIsValid(from, to)) return null;
    return this.alphabeta(this.state.move(from, to), undefined, undefined, 3);
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
