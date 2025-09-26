// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const restartButton = document.getElementById('restartButton');
const gameOverScreen = document.getElementById('gameOver');
const levelDisplay = document.getElementById('level');
const finalMessage = document.getElementById('finalMessage');
const topLine = document.getElementById('topLine');

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    createDashedLine();
}

// Create dashed line at the top
function createDashedLine() {
    topLine.innerHTML = '';
    const lineWidth = window.innerWidth;
    const segmentWidth = 20;
    const gapWidth = 10;
    const segments = Math.ceil(lineWidth / (segmentWidth + gapWidth));
    
    for (let i = 0; i < segments; i++) {
        const segment = document.createElement('div');
        segment.style.position = 'absolute';
        segment.style.left = `${i * (segmentWidth + gapWidth)}px`;
        segment.style.width = `${segmentWidth}px`;
        segment.style.height = '100%';
        segment.style.background = 'rgba(255, 107, 107, 0.7)';
        segment.style.boxShadow = '0 0 10px rgba(255, 107, 107, 0.5)';
        topLine.appendChild(segment);
    }
}

// Game settings
const gameSettings = {
    gravity: 0.5,
    friction: 0.95,
    restitution: 0.3, // Reduced bounce effect
    maxLevel: 8,
    baseEmojiSize: 40,
    gameOverLine: 100
};

// Emoji levels
const emojiLevels = [
    "☹️", // Level 1
    "😕", // Level 2
    "😔", // Level 3
    "🥺", // Level 4
    "😑", // Level 5
    "😬", // Level 6
    "🙂", // Level 7
    "😍"  // Level 8 (target)
];

// Game state
let gameState = {
    isRunning: false,
    score: 0,
    currentLevel: 1,
    emojis: [],
    nextEmoji: null,
    gameOver: false
};

// Emoji class
class Emoji {
    constructor(x, y, level) {
        this.x = x;
        this.y = y;
        this.level = level;
        this.emoji = emojiLevels[level - 1];
        // Each level is 37% larger than the previous
        this.radius = gameSettings.baseEmojiSize / 2 * Math.pow(1.37, level - 1);
        this.velocityY = 0;
        this.velocityX = 0;
        this.onGround = false;
        this.merging = false;
        this.mergeProgress = 0;
    }
    
    draw() {
        // Emoji text - only the emoji without background
        ctx.font = `${this.radius * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, this.x, this.y);
        
        // Merge animation
        if (this.merging) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * (1 + this.mergeProgress/10), 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }
    
    update() {
        // Apply gravity
        if (!this.onGround) {
            this.velocityY += gameSettings.gravity;
            this.y += this.velocityY;
        }
        
        // Horizontal movement (friction)
        this.velocityX *= gameSettings.friction;
        this.x += this.velocityX;
        
        // Ground collision
        if (this.y + this.radius >= canvas.height) {
            this.y = canvas.height - this.radius;
            this.velocityY *= -gameSettings.restitution;
            this.onGround = Math.abs(this.velocityY) < 0.5;
            
            if (this.onGround) {
                this.velocityY = 0;
            }
        }
        
        // Collision detection with other emojis
        for (const other of gameState.emojis) {
            if (other !== this) {
                const collision = this.checkCollision(other);
                if (collision.collided) {
                    // Collision response
                    this.resolveCollision(other, collision);
                    
                    // Same level emojis should merge
                    if (this.level === other.level && !this.merging && !other.merging) {
                        this.handleMerge(other);
                    }
                }
            }
        }
        
        // Wall collisions
        if (this.x - this.radius <= 0) {
            this.x = this.radius;
            this.velocityX *= -gameSettings.restitution;
        }
        if (this.x + this.radius >= canvas.width) {
            this.x = canvas.width - this.radius;
            this.velocityX *= -gameSettings.restitution;
        }
        
        // Top boundary check (red line)
        if (this.y - this.radius <= gameSettings.gameOverLine) {
            endGame(false);
        }
        
        // Merge animation
        if (this.merging) {
            this.mergeProgress += 0.2;
            if (this.mergeProgress >= 10) {
                this.merging = false;
                this.mergeProgress = 0;
            }
        }
    }
    
    // Collision detection
    checkCollision(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = this.radius + other.radius;
        
        return {
            collided: distance < minDistance,
            dx: dx,
            dy: dy,
            distance: distance,
            minDistance: minDistance
        };
    }
    
    // Collision resolution (real physics)
    resolveCollision(other, collision) {
        // Collision normal and depth
        const nx = collision.dx / collision.distance;
        const ny = collision.dy / collision.distance;
        const penetrationDepth = collision.minDistance - collision.distance;
        
        // Position correction
        const correctionFactor = 0.5;
        this.x += nx * penetrationDepth * correctionFactor;
        this.y += ny * penetrationDepth * correctionFactor;
        other.x -= nx * penetrationDepth * correctionFactor;
        other.y -= ny * penetrationDepth * correctionFactor;
        
        // Relative velocity
        const dvx = this.velocityX - other.velocityX;
        const dvy = this.velocityY - other.velocityY;
        
        // Velocity in collision direction
        const speed = dvx * nx + dvy * ny;
        
        // Exit if no collision effect
        if (speed < 0) return;
        
        // Collision impulse
        const impulse = 2 * speed / (1 + 1); // Masses considered equal
        
        // Update velocities
        this.velocityX -= impulse * nx;
        this.velocityY -= impulse * ny;
        other.velocityX += impulse * nx;
        other.velocityY += impulse * ny;
    }
    
    // Merge process
    handleMerge(other) {
        // Start merge animation
        this.merging = true;
        other.merging = true;
        
        // Perform merge in the next frame
        setTimeout(() => {
            mergeEmojis(this, other);
        }, 300);
    }
}

// Start the game
function startGame() {
    resizeCanvas();
    gameState.isRunning = true;
    gameState.score = 0;
    gameState.currentLevel = 1;
    gameState.emojis = [];
    gameState.gameOver = false;
    gameOverScreen.style.display = 'none';
    
    // Create first emoji
    generateNextEmoji();
    
    // Start game loop
    gameLoop();
}

// Generate next emoji
function generateNextEmoji() {
    // Random level 1 or 2 emoji
    const level = Math.random() < 0.7 ? 1 : 2;
    gameState.nextEmoji = level;
}

// Add emoji at clicked position
function addEmoji(x, y) {
    if (!gameState.isRunning || gameState.gameOver) return;
    
    const level = gameState.nextEmoji;
    const newEmoji = new Emoji(x, Math.max(100 + level * 10, y), level);
    gameState.emojis.push(newEmoji);
    
    // Generate next emoji
    generateNextEmoji();
    
    // Update display
    updateDisplay();
}

// Merge two emojis
function mergeEmojis(emoji1, emoji2) {
    // Check if emojis still exist
    if (!gameState.emojis.includes(emoji1) || !gameState.emojis.includes(emoji2)) {
        return;
    }
    
    // Create new emoji
    const newLevel = emoji1.level + 1;
    const newX = (emoji1.x + emoji2.x) / 2;
    const newY = (emoji1.y + emoji2.y) / 2;
    
    // Remove old emojis
    const index1 = gameState.emojis.indexOf(emoji1);
    const index2 = gameState.emojis.indexOf(emoji2);
    
    if (index1 > -1 && index2 > -1) {
        gameState.emojis.splice(Math.max(index1, index2), 1);
        gameState.emojis.splice(Math.min(index1, index2), 1);
        
        // Add new emoji
        const newEmoji = new Emoji(newX, newY, newLevel);
        gameState.emojis.push(newEmoji);
        
        // Update score and level
        gameState.score += newLevel * 10;
        gameState.currentLevel = Math.max(gameState.currentLevel, newLevel);
        
        // Target check
        if (newLevel >= gameSettings.maxLevel) {
            endGame(true);
        }
        
        // Update display
        updateDisplay();
    }
}

// End the game
function endGame(isWin) {
    gameState.isRunning = false;
    gameState.gameOver = true;
    
    if (isWin) {
        finalMessage.textContent = `Congratulations! You reached level ${gameSettings.maxLevel}!`;
    } else {
        finalMessage.textContent = "The emojis reached the top line! Game Over!";
    }
    
    gameOverScreen.style.display = 'flex';
}

// Update display
function updateDisplay() {
    levelDisplay.textContent = gameState.currentLevel;
}

// Game loop
function gameLoop() {
    if (!gameState.isRunning) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw emojis
    gameState.emojis.forEach(emoji => {
        emoji.update();
        emoji.draw();
    });
    
    // Continue loop if game is still running
    if (!gameState.gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

// Mouse/click events
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    addEmoji(x, y);
});

// Touch screen support
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    addEmoji(x, y);
});

// Resize canvas when window size changes
window.addEventListener('resize', resizeCanvas);

// Button events
restartButton.addEventListener('click', startGame);

// Start the game
startGame();
