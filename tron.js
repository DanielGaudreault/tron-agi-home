// ===== TRON WORLD - OFFLINE BROWSER GAME =====
const canvas = document.getElementById("tronCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ==== GRID ====
function drawGrid() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(0, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    // Horizontal lines
    for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// ==== USER (Player) ====
class User {
    constructor() {
        this.x = 100;
        this.y = 100;
        this.speed = 5;
        this.color = "blue";
        this.trail = [];
    }
    move(direction) {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 50) this.trail.shift();
        
        if (direction === "UP") this.y -= this.speed;
        if (direction === "DOWN") this.y += this.speed;
        if (direction === "LEFT") this.x -= this.speed;
        if (direction === "RIGHT") this.x += this.speed;
    }
    draw() {
        // Trail
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (this.trail.length > 0) {
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (const point of this.trail) {
                ctx.lineTo(point.x, point.y);
            }
            ctx.stroke();
        }
        // Player
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ==== ISO (AI Entity) ====
class ISO {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.color = "yellow";
        this.trail = [];
        this.direction = Math.random() * Math.PI * 2;
    }
    update(userX, userY) {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 30) this.trail.shift();
        
        // Simple AI: Chase player (comment out for random movement)
        const dx = userX - this.x;
        const dy = userY - this.y;
        this.direction = Math.atan2(dy, dx);
        
        this.x += Math.cos(this.direction) * 3;
        this.y += Math.sin(this.direction) * 3;
        
        // Wrap around screen
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
    }
    draw() {
        // Trail
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (this.trail.length > 0) {
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (const point of this.trail) {
                ctx.lineTo(point.x, point.y);
            }
            ctx.stroke();
        }
        // ISO
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ==== GAME LOOP ====
const user = new User();
const isos = Array(5).fill().map(() => new ISO());

function gameLoop() {
    drawGrid();
    user.draw();
    isos.forEach(iso => {
        iso.update(user.x, user.y);  // Pass player position to ISO AI
        iso.draw();
    });
    requestAnimationFrame(gameLoop);
}

// Keyboard controls
const keys = {};
window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
});
window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});

function handleInput() {
    if (keys["ArrowUp"] || keys["w"]) user.move("UP");
    if (keys["ArrowDown"] || keys["s"]) user.move("DOWN");
    if (keys["ArrowLeft"] || keys["a"]) user.move("LEFT");
    if (keys["ArrowRight"] || keys["d"]) user.move("RIGHT");
}

// Main loop
function loop() {
    handleInput();
    gameLoop();
}
loop();
