// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to fullscreen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game variables
let score = 0;
let health = 100;
let gameOver = false;
let animationId;
let isFiring = false;
let lastBulletTime = 0;
const bulletDelay = 150; // ms between bullets when holding fire

// Player spaceship
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 100,
    width: 50,
    height: 70,
    speed: 8,
    color: '#4CAF50',
    isMovingLeft: false,
    isMovingRight: false
};

// Arrays for game objects
let bullets = [];
let enemies = [];
let particles = [];
let stars = [];

// Create random stars for background
function createStars() {
    stars = [];
    const starCount = 200;
    
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            brightness: Math.random() * 0.8 + 0.2
        });
    }
}

createStars();

// Control buttons
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const fireBtn = document.getElementById('fireBtn');

// Keyboard events (for PC)
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') player.isMovingLeft = true;
    if (e.key === 'ArrowRight') player.isMovingRight = true;
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        isFiring = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') player.isMovingLeft = false;
    if (e.key === 'ArrowRight') player.isMovingRight = false;
    if (e.key === ' ' || e.key === 'Spacebar') {
        isFiring = false;
    }
});

// Mobile touch controls
leftBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    player.isMovingLeft = true;
});

leftBtn.addEventListener('touchend', () => {
    player.isMovingLeft = false;
});

rightBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    player.isMovingRight = true;
});

rightBtn.addEventListener('touchend', () => {
    player.isMovingRight = false;
});

fireBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isFiring = true;
});

fireBtn.addEventListener('touchend', () => {
    isFiring = false;
});

// Shooting function
function shoot() {
    const currentTime = Date.now();
    if (currentTime - lastBulletTime > bulletDelay) {
        bullets.push({
            x: player.x + player.width / 2 - 3,
            y: player.y,
            width: 6,
            height: 15,
            speed: 10,
            color: '#FF5252'
        });
        lastBulletTime = currentTime;
    }
}

// Create enemy
function createEnemy() {
    if (gameOver) return;
    
    const width = 40 + Math.random() * 30;
    const isStrong = Math.random() < 0.2; // 20% chance for strong enemy
    
    enemies.push({
        x: Math.random() * (canvas.width - width),
        y: -50,
        width: width,
        height: 40 + Math.random() * 30,
        speed: 2 + Math.random() * 3,
        color: isStrong ? `hsl(${Math.random() * 60}, 70%, 50%)` : `hsl(${Math.random() * 60 + 200}, 70%, 50%)`,
        health: isStrong ? 3 : 1, // Strong enemies take 3 hits
        isStrong: isStrong
    });
}

// Create particle effect
function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            radius: Math.random() * 3 + 1,
            color: color,
            speedX: (Math.random() - 0.5) * 5,
            speedY: (Math.random() - 0.5) * 5,
            life: 30
        });
    }
}

// Check collision between two rectangles
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Update game state
function update() {
    // Player movement
    if (player.isMovingLeft && player.x > 0) {
        player.x -= player.speed;
    }
    if (player.isMovingRight && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    
    // Handle firing
    if (isFiring) {
        shoot();
    }
    
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        
        // Remove bullets that go off screen
        if (bullets[i].y < -bullets[i].height) {
            bullets.splice(i, 1);
            continue;
        }
        
        // Check bullet-enemy collisions
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (checkCollision(bullets[i], enemies[j])) {
                // Damage enemy
                enemies[j].health--;
                
                // Create hit effect
                createParticles(
                    enemies[j].x + enemies[j].width / 2,
                    enemies[j].y + enemies[j].height / 2,
                    enemies[j].color,
                    8
                );
                
                // Remove bullet
                bullets.splice(i, 1);
                
                // Check if enemy is destroyed
                if (enemies[j].health <= 0) {
                    // Add score (more for strong enemies)
                    score += enemies[j].isStrong ? 30 : 10;
                    document.getElementById('score').textContent = score;
                    
                    // Create explosion
                    createParticles(
                        enemies[j].x + enemies[j].width / 2,
                        enemies[j].y + enemies[j].height / 2,
                        enemies[j].color,
                        15
                    );
                    
                    // Remove enemy
                    enemies.splice(j, 1);
                }
                
                break;
            }
        }
    }
    
    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += enemies[i].speed;
        
        // Check if enemy reached the bottom
        if (enemies[i].y > canvas.height) {
            // Deduct health based on enemy type
            health -= enemies[i].isStrong ? 15 : 5;
            document.getElementById('health').textContent = health;
            
            // Create escape effect
            createParticles(
                enemies[i].x + enemies[i].width / 2,
                canvas.height,
                enemies[i].color,
                10
            );
            
            // Remove enemy
            enemies.splice(i, 1);
            
            // Check if game over
            if (health <= 0) {
                gameOver = true;
                document.getElementById('finalScore').textContent = score;
                document.getElementById('gameOver').style.display = 'block';
                cancelAnimationFrame(animationId);
            }
            
            continue;
        }
        
        // Check player-enemy collisions
        if (checkCollision(player, enemies[i])) {
            // Take damage (more from strong enemies)
            health -= enemies[i].isStrong ? 25 : 10;
            document.getElementById('health').textContent = health;
            
            // Create collision effect
            createParticles(
                player.x + player.width / 2,
                player.y + player.height / 2,
                player.color,
                20
            );
            
            // Remove enemy
            enemies.splice(i, 1);
            
            // Check if game over
            if (health <= 0) {
                gameOver = true;
                document.getElementById('finalScore').textContent = score;
                document.getElementById('gameOver').style.display = 'block';
                cancelAnimationFrame(animationId);
            }
        }
    }
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].speedX;
        particles[i].y += particles[i].speedY;
        particles[i].life--;
        
        // Remove dead particles
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Draw everything
function draw() {
    // Clear with semi-transparent black for trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars
    stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    
    // Draw player
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();
    
    // Draw bullets
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    
    // Draw enemies
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y);
        ctx.lineTo(enemy.x + enemy.width, enemy.y);
        ctx.lineTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
        ctx.closePath();
        ctx.fill();
        
        // Draw health bar for strong enemies
        if (enemy.isStrong) {
            const barWidth = enemy.width;
            const barHeight = 5;
            const barX = enemy.x;
            const barY = enemy.y - 10;
            
            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Health
            ctx.fillStyle = enemy.health > 1 ? '#4CAF50' : '#FF5252';
            ctx.fillRect(barX, barY, barWidth * (enemy.health / 3), barHeight);
        }
    });
    
    // Draw particles
    particles.forEach(particle => {
        ctx.globalAlpha = particle.life / 30;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// Game loop
function gameLoop() {
    if (gameOver) return;
    
    update();
    draw();
    
    animationId = requestAnimationFrame(gameLoop);
}

// Start the game
function startGame() {
    // Reset game state
    score = 0;
    health = 100;
    gameOver = false;
    bullets = [];
    enemies = [];
    particles = [];
    player.x = canvas.width / 2 - 25;
    isFiring = false;
    
    // Update UI
    document.getElementById('score').textContent = score;
    document.getElementById('health').textContent = health;
    document.getElementById('gameOver').style.display = 'none';
    
    // Create new stars for background
    createStars();
    
    // Start enemy spawner
    setInterval(createEnemy, 1000);
    
    // Start game loop
    gameLoop();
}

// Restart button
document.getElementById('restartBtn').addEventListener('click', startGame);

// Start the game
startGame();