import { DrawingState } from ".."
import { Position } from "../engine/State"
import { fontSize, pieceSize } from "./board"

export function renderMove(
  drawingContext: DrawingState,
  score: number | null,
  pos: Position
) {
  drawingContext.ctx.beginPath()
  drawingContext.ctx.arc(
    pos.x * pieceSize + pieceSize / 2,
    pos.y * pieceSize + pieceSize / 2,
    fontSize * 2,
    0,
    2 * Math.PI
  )

  drawingContext.ctx.stroke()
  drawingContext.ctx.fillStyle = "white"
  drawingContext.ctx.fill()
  drawingContext.ctx.closePath()

  drawingContext.ctx.beginPath()

  drawingContext.ctx.font = `normal normal bold ${fontSize}px serif`
  drawingContext.ctx.textBaseline = "middle"
  drawingContext.ctx.textAlign = "center"
  drawingContext.ctx.fillStyle = "black"

  let scoreTexts: string[] = []
  if (score === null) {
  } else if (score === 0) {
    scoreTexts = [score.toFixed(0)]
  } else if (score <= -100000) {
    scoreTexts = ["Game", "over!"]
  } else if (score >= 100000) {
    scoreTexts = ["Check", "mate!"]
  } else if (score > 0) {
    scoreTexts = [Math.log(1 + score).toFixed(0)]
  } else {
    scoreTexts = [(-Math.log(1 + Math.abs(score))).toFixed(0)]
  }

  for (let i = 0; i < scoreTexts.length; i++) {
    drawingContext.ctx.beginPath()
    drawingContext.ctx.fillText(
      scoreTexts[i],
      pos.x * pieceSize + pieceSize / 2,
      pos.y * pieceSize +
        pieceSize / 2 +
        (i - (scoreTexts.length - 1) / 2) * fontSize
    )
    drawingContext.ctx.closePath()
  }
}
