class ISO {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.color = "yellow";
  }
  
  move() {
    // Simple random movement
    this.x += Math.random() * 6 - 3;
    this.y += Math.random() * 6 - 3;
  }
  
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}
