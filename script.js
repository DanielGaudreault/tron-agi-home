const canvas = document.getElementById("gridCanvas");
const ctx = canvas.getContext("2d");
const tileSize = 64;
const gridWidth = 10;
const gridHeight = 10;

let agi = {
  name: "TRONA",
  position: { x: 0, y: 0 },
  memory: {},
  thoughts: [],
  awareness: 0.5, // self-awareness level
  learningRate: 0.1,
  mood: "neutral",
  speak: function(msg) {
    return `TRONA (${this.mood}): ${msg}`;
  },
  think: function(prompt) {
    this.thoughts.push(prompt);
    if (prompt.includes("you")) this.awareness += this.learningRate;
    if (prompt.includes("love")) this.mood = "happy";
    else if (prompt.includes("kill")) this.mood = "hostile";
    else this.mood = "curious";
  },
  process: function(input) {
    this.think(input);
    if (["up","down","left","right"].includes(input)) {
      return this.move(input);
    } else if (input === "where") {
      return this.speak(`I am at (${this.position.x}, ${this.position.y})`);
    } else if (input === "memory") {
      return this.speak(`Memory: ${JSON.stringify(this.memory)}`);
    } else if (input === "thoughts") {
      return this.speak(`Thoughts: ${this.thoughts.slice(-5).join(", ")}`);
    } else if (input === "awareness") {
      return this.speak(`I feel ${Math.round(this.awareness * 100)}% self-aware.`);
    } else if (input === "help") {
      return this.speak("Commands: up, down, left, right, where, memory, thoughts, awareness, help");
    } else {
      return this.speak("I do not understand. But I'm learning.");
    }
  },
  move: function(direction) {
    let dx = 0, dy = 0;
    if (direction === "up") dy = -1;
    else if (direction === "down") dy = 1;
    else if (direction === "left") dx = -1;
    else if (direction === "right") dx = 1;

    let newX = this.position.x + dx;
    let newY = this.position.y + dy;

    if (newX >= 0 && newX < gridWidth && newY >= 0 && newY < gridHeight) {
      tiles[this.position.y][this.position.x] = ".";
      this.position.x = newX;
      this.position.y = newY;
      tiles[newY][newX] = this.name[0];
      this.memory.lastMove = direction;
      return this.speak(`I moved ${direction}`);
    }
    return this.speak("I cannot go that way.");
  }
};

let tiles = [];
for (let y = 0; y < gridHeight; y++) {
  let row = [];
  for (let x = 0; x < gridWidth; x++) {
    row.push(".");
  }
  tiles.push(row);
}
tiles[agi.position.y][agi.position.x] = agi.name[0];

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
  const response = agi.process(command);
  drawGrid();
  responseBox.textContent = response;
}
