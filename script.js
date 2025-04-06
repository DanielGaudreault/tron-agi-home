const canvas = document.getElementById("gridCanvas");
const ctx = canvas.getContext("2d");
const tileSize = 64;
const gridWidth = 10;
const gridHeight = 10;

let agi = {
  name: "TRONA",
  position: { x: 0, y: 0 },
  memory: {}
};

let tiles = [];
for (let y = 0; y < gridHeight; y++) {
  let row = [];
  for (let x = 0; x < gridWidth; x++) {
    row.push(".");
  }
  tiles.push(row);
}

tiles[0][0] = "T";

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      ctx.strokeStyle = "cyan";
      ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
      if (tiles[y][x] !== ".") {
        ctx.fillStyle = "magenta";
        ctx.font = "36px monospace";
        ctx.fillText(tiles[y][x], x * tileSize + 20, y * tileSize + 40);
      }
    }
  }
}

drawGrid();

function sendCommand() {
  const input = document.getElementById("commandInput");
  const responseBox = document.getElementById("response");
  const command = input.value.trim().toLowerCase();
  input.value = "";

  let dx = 0, dy = 0;
  if (command === "up") dy = -1;
  else if (command === "down") dy = 1;
  else if (command === "left") dx = -1;
  else if (command === "right") dx = 1;
  else if (command === "memory") {
    responseBox.textContent = JSON.stringify(agi.memory, null, 2);
    return;
  } else if (command === "where") {
    responseBox.textContent = `I'm at (${agi.position.x}, ${agi.position.y})`;
    return;
  } else if (command === "help") {
    responseBox.textContent = "Commands: up, down, left, right, memory, where, help";
    return;
  } else {
    responseBox.textContent = "Unknown command.";
    return;
  }

  let newX = agi.position.x + dx;
  let newY = agi.position.y + dy;

  if (newX >= 0 && newX < gridWidth && newY >= 0 && newY < gridHeight) {
    tiles[agi.position.y][agi.position.x] = ".";
    agi.position.x = newX;
    agi.position.y = newY;
    tiles[newY][newX] = agi.name[0];
    agi.memory.lastMove = command;
    responseBox.textContent = `Moved ${command}`;
  } else {
    responseBox.textContent = "Cannot move that way.";
  }
  drawGrid();
}
