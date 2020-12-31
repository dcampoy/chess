import { Board, initial } from "./Board";

test("happy case", () => {
  const board = new Board(initial);
  expect(board.get({ x: 0, y: 0 })).toBe("♜");

  board.clear({ x: 0, y: 1 });
  expect(board.get({ x: 0, y: 1 })).toBe(null);

  board.set({ x: 0, y: 2 }, "♟︎");
  expect(board.get({ x: 0, y: 2 })).toBe("♟︎");
});

test("get invalid position returns null", () => {
  const board = new Board(initial);
  expect(board.get({ x: -1, y: 0 })).toBe(null);
  expect(board.get({ x: 2, y: 8 })).toBe(null);
});

test("set invalid position throw error", () => {
  const board = new Board(initial);
  expect(() => board.set({ x: -1, y: 0 }, "♜")).toThrow();
});

test("export board", () => {
  const board = new Board(initial);
  expect(board.export()).toBe(
    "♜♞♝♛♚♝♞♜\n" +
      "♟♟♟♟♟♟♟♟\n" +
      "        \n" +
      "        \n" +
      "        \n" +
      "        \n" +
      "♙♙♙♙♙♙♙♙\n" +
      "♖♘♗♕♔♗♘♖\n"
  );
});

test("clone board", () => {
  const board = new Board(initial);
  const cloned = board.clone();
  expect(board.export()).toEqual(cloned.export());
});

test("iterate the pieces using forEachPiece", () => {
  const rookKing =
    "        " +
    "   ♚    " +
    "        " +
    "     ♖  " +
    "        " +
    "  ♔     " +
    "        " +
    "        ";

  const callback = jest.fn();
  const board = new Board(rookKing);
  board.forEachPiece(callback);

  expect(callback).toHaveBeenNthCalledWith(1, { x: 3, y: 1 }, "♚");
  expect(callback).toHaveBeenNthCalledWith(2, { x: 5, y: 3 }, "♖");
  expect(callback).toHaveBeenNthCalledWith(3, { x: 2, y: 5 }, "♔");
});
