import { DrawingState } from ".."

export const lightWood = "#FFECB3"
export const darkWood = "#795548"
export const boardSize = 800
export const pieceSize = boardSize / 8
export const fontSize = 14

export async function drawBoard(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = lightWood
  ctx.fillRect(0, 0, boardSize, boardSize)
  const squareSize = boardSize / 8

  for (let i = 0; i < 32; i++) {
    ctx.fillStyle = darkWood
    const y = Math.floor(i / 4)
    const x = (i % 4) + (y % 2) / 2
    ctx.fillRect(x * squareSize * 2, y * squareSize, squareSize, squareSize)
  }
}

export async function renderBoard(drawingState: DrawingState) {
  drawingState.ctx.drawImage(
    drawingState.textures.board,
    0,
    0,
    boardSize,
    boardSize
  )
}

export async function renderCheckmate(drawingState: DrawingState) {
  const msg = "Checkmate"
  drawingState.ctx.font = `normal normal bold 60px serif`
  drawingState.ctx.textBaseline = "middle"
  drawingState.ctx.textAlign = "center"

  drawingState.ctx.strokeStyle = "black"
  drawingState.ctx.lineWidth = 5
  drawingState.ctx.fillStyle = "white"

  drawingState.ctx.strokeText(msg, boardSize / 2, boardSize / 2)

  drawingState.ctx.fillText(msg, boardSize / 2, boardSize / 2)
}
