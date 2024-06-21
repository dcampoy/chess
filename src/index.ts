import { drawPiece, piecePaths, renderPiece } from "./ui/pieces"
import { GameState, initial, rookKing } from "./engine/Board"
import { Position, State } from "./engine/State"
import Engine from "./engine/Engine"
import {
  boardSize,
  drawBoard,
  pieceSize,
  renderBoard,
  renderCheckmate,
} from "./ui/board"
import { renderMove } from "./ui/move"

const rookKingState = new State(
  new GameState(rookKing),
  "white",
  null,
  false,
  false
)

const defaultState = new State(
  new GameState(initial),
  "white",
  null,
  true,
  true
)

export type DrawingState = {
  readonly ctx: CanvasRenderingContext2D
  readonly textures: {
    readonly board: ImageBitmap
    readonly pieces: Record<string, ImageBitmap>
  }
}

async function init(
  rootNode: Element
): Promise<[DrawingState, HTMLCanvasElement]> {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Unable to get canvas 2d context")
  }

  canvas.setAttribute("width", `${boardSize}px`)
  canvas.setAttribute("height", `${boardSize}px`)
  ctx.clearRect(0, 0, boardSize, boardSize)
  await drawBoard(ctx)
  const boardTexture = await createImageBitmap(canvas)

  canvas.setAttribute("width", `${pieceSize}px`)
  canvas.setAttribute("height", `${pieceSize}px`)

  const pieces: Record<string, ImageBitmap> = {}
  for (const piece of Object.keys(piecePaths)) {
    ctx.clearRect(0, 0, pieceSize, pieceSize)
    ctx.beginPath()
    await drawPiece(ctx, piecePaths[piece].path, piecePaths[piece].color)
    ctx.closePath()
    pieces[piece] = await createImageBitmap(canvas)
  }

  canvas.setAttribute("width", `${boardSize}px`)
  canvas.setAttribute("height", `${boardSize}px`)

  rootNode.appendChild(canvas)
  return [
    {
      ctx,
      textures: {
        board: boardTexture,
        pieces,
      },
    },
    canvas,
  ]
}

function render(
  drawingState: DrawingState,
  state: State,
  selected: Position | null
) {
  renderBoard(drawingState)

  // Draw pieces
  state.board.forEachPiece((pos, piece) => {
    renderPiece(drawingState, piece, pos)
  })

  // When seleced draw shadow of the piece for valid moves
  if (selected) {
    const validMoves = state.validMoves(selected)
    for (const to of validMoves) {
      const engine = new Engine(state)
      const score = engine.score(selected, to)
      renderMove(drawingState, score, to)
    }
  }

  if (state.inCheckmate()) {
    renderCheckmate(drawingState)
  }
}

const root = document.getElementById("root")

if (!root) {
  throw new Error("Invalid root element")
}

init(root).then(([drawingState, canvas]) => {
  let gameState = defaultState
  let selected: Position | null = null

  // Controller
  canvas.addEventListener("click", (ev) => {
    const cell = {
      x: Math.floor(ev.offsetX / pieceSize),
      y: Math.floor(ev.offsetY / pieceSize),
    }

    if (!selected && gameState.validMoves(cell).length > 0) {
      selected = cell
      render(drawingState, gameState, selected)
      return
    }

    if (selected) {
      if (
        gameState
          .validMoves(selected)
          .find((move) => move.x === cell.x && move.y === cell.y)
      ) {
        gameState = gameState.move(selected, cell)
        selected = null
      } else {
        selected = null
      }
      render(drawingState, gameState, selected)
      return
    }
  })

  render(drawingState, gameState, selected)
})
