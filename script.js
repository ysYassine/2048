import Grid from "./Grid.js";
import Tile from "./Tile.js";

let startX, startY, endX, endY;
const minTouchDistance = 100;
const scrollEvent = { key: "" };

const gameBoard = document.getElementById("game-board");
const grid = new Grid(gameBoard);
grid.randomEmptyCell().tile = new Tile(gameBoard);
grid.randomEmptyCell().tile = new Tile(gameBoard);
setupInput();

function setupInput() {
  window.addEventListener("keydown", handleInput, { once: true });
  gameBoard.addEventListener("touchstart", handleTouchStart, {
    once: true,
    passive: false,
  });
  gameBoard.addEventListener("touchend", handleTouchEnd, {
    once: true,
    passive: false,
  });
}

function handleTouchStart(e) {
  startX = e.changedTouches["0"].clientX;
  startY = e.changedTouches["0"].clientY;
}

function handleTouchEnd(e) {
  endX = e.changedTouches["0"].clientX;
  endY = e.changedTouches["0"].clientY;
  const dX = startX - endX;
  const dY = startY - endY;
  // dY positive => Up
  // dY negative => Down
  // dX positive => Left
  // dX negative => Right

  if (Math.abs(dY) > minTouchDistance || Math.abs(dX) > minTouchDistance) {
    // Vertical Swipe
    if (Math.abs(dY) > Math.abs(dX)) {
      if (dY > 0) {
        scrollEvent.key = "ArrowUp";
      } else {
        scrollEvent.key = "ArrowDown";
      }
    }
    // Horizental Swipe
    else {
      if (dX > 0) {
        scrollEvent.key = "ArrowLeft";
      } else {
        scrollEvent.key = "ArrowRight";
      }
    }
    handleInput(scrollEvent);
  } else setupInput();
}

async function handleInput(e) {
  switch (e.key) {
    case "ArrowUp":
      if (!canMoveUp()) {
        setupInput();
        return;
      }
      await moveUp();
      break;

    case "ArrowDown":
      if (!canMoveDown()) {
        setupInput();
        return;
      }
      await moveDown();
      break;

    case "ArrowLeft":
      if (!canMoveLeft()) {
        setupInput();
        return;
      }
      if (!canMoveRight()) {
        setupInput();
        return;
      }
      await moveLeft();
      break;

    case "ArrowRight":
      await moveRight();
      break;

    default:
      setupInput();
      return;
  }
  grid.cells.forEach((cell) => cell.mergeTiles());
  console.log(
    !canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()
  );
  const newTile = new Tile(gameBoard);
  grid.randomEmptyCell().tile = newTile;
  if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight())
    newTile.waitForTransition(true).then(() => {
      alert("You have lost");
    });
  else setupInput();
}

function moveUp() {
  return slideTiles(grid.cellsByColumn);
}

function moveDown() {
  return slideTiles(grid.cellsByColumn.map((column) => [...column].reverse()));
}

function moveLeft() {
  return slideTiles(grid.cellsByRow);
}

function moveRight() {
  return slideTiles(grid.cellsByRow.map((column) => [...column].reverse()));
}

function slideTiles(cells) {
  return Promise.all(
    cells.flatMap((group) => {
      const promises = [];
      for (let i = 1; i < group.length; i++) {
        const cell = group[i];
        if (cell.tile == null) continue;
        let lastValidCell;
        for (let j = i - 1; j >= 0; j--) {
          const moveToCell = group[j];
          if (!moveToCell.canAccept(cell.tile)) break;
          lastValidCell = moveToCell;
        }
        if (lastValidCell != null) {
          promises.push(cell.tile.waitForTransition());
          if (lastValidCell.tile != null) lastValidCell.mergeTile = cell.tile;
          else {
            lastValidCell.tile = cell.tile;
          }
          cell.tile = null;
        }
      }
      return promises;
    })
  );
}

function canMoveUp() {
  return canMove(grid.cellsByColumn);
}

function canMoveDown() {
  return canMove(grid.cellsByColumn.map((column) => [...column].reverse()));
}

function canMoveLeft() {
  return canMove(grid.cellsByRow);
}

function canMoveRight() {
  return canMove(grid.cellsByRow.map((row) => [...row].reverse()));
}

function canMove(cells) {
  return cells.some((group) => {
    return group.some((cell, index) => {
      if (index === 0) return false;
      if (cell.tile == null) return false;
      const moveToCell = group[index - 1];
      return moveToCell.canAccept(cell.tile);
    });
  });
}
