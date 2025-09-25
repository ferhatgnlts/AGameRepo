// Game elements
const gameContainer = document.getElementById('game-container');
const tower = document.getElementById('tower');
const attackRange = document.getElementById('attack-range');
const scoreElement = document.getElementById('score');
const goldElement = document.getElementById('gold');
const upgradeBtn = document.getElementById('upgrade-btn');
const upgradeMenu = document.getElementById('upgrade-menu');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const finalGoldElement = document.getElementById('final-gold');
const restartBtn = document.getElementById('restart-btn');

// Game configuration
const config = {
    towerSize: 40,
    enemySize: 30,
    bulletSize: 6,
    baseAttackRange: 150,
    baseTowerHealth: 100,
    baseEnemySpeed: 1.3,
    initialSpawnRate: 1500,
    minSpawnRate: 600,
    baseBulletSpeed: 6,
    baseShootInterval: 500,
    baseDamage: 1,
    baseGoldPerKill: 5,
    upgradeCostMultiplier: 1.5
};

// Game state
let score = 0;
let gold = 0;
let gameActive = true;
let enemies = [];
let bullets = [];
let spawnRate = config.initialSpawnRate;
let lastSpawnTime = 0;
let towerHealth = config.baseTowerHealth;
let shootIntervalId = null;

// Tower stats
let towerStats = {
    attackRange: config.baseAttackRange,
    damage: config.baseDamage,
    shootInterval: config.baseShootInterval,
    doubleShot: false,
    rangeLevel: 1,
    damageLevel: 1,
    speedLevel: 1,
    doubleShotPurchased: false
};

// Upgrade costs
let upgradeCosts = {
    range: 50,
    damage: 75,
    speed: 100,
    double: 150
};

// Initialize tower health bar
function createTowerHealthBar() {
    const healthBarBg = document.createElement('div');
    healthBarBg.style.position = 'absolute';
    healthBarBg.style.top = '-12px';
    healthBarBg.style.left = '0';
    healthBarBg.style.width = '100%';
    healthBarBg.style.height = '6px';
    healthBarBg.style.backgroundColor = '#7f8c8d';
    healthBarBg.style.borderRadius = '3px';
    
    const healthBar = document.createElement('div');
    healthBar.style.position = 'absolute';
    healthBar.style.top = '-12px';
    healthBar.style.left = '0';
    healthBar.style.width = '100%';
    healthBar.style.height = '6px';
    healthBar.style.backgroundColor = '#2ecc71';
    healthBar.style.borderRadius = '3px';
    healthBar.id = 'tower-health';
    
    tower.appendChild(healthBarBg);
    tower.appendChild(healthBar);
}

// Spawn enemy with random properties
function spawnEnemy() {
    if (!gameActive) return;
    
    const enemy = document.createElement('div');
    enemy.className = 'enemy';
    
    // Create health bar
    const healthBarBg = document.createElement('div');
    healthBarBg.className = 'health-bar-background';
    
    const healthBar = document.createElement('div');
    healthBar.className = 'health-bar';
    
    enemy.appendChild(healthBarBg);
    enemy.appendChild(healthBar);
    
    gameContainer.appendChild(enemy);
    
    // Spawn from random corner
    const corner = Math.floor(Math.random() * 4);
    let x, y;
    
    switch (corner) {
        case 0: // top left
            x = 0;
            y = 0;
            break;
        case 1: // top right
            x = gameContainer.offsetWidth - config.enemySize;
            y = 0;
            break;
        case 2: // bottom left
            x = 0;
            y = gameContainer.offsetHeight - config.enemySize;
            break;
        case 3: // bottom right
            x = gameContainer.offsetWidth - config.enemySize;
            y = gameContainer.offsetHeight - config.enemySize;
            break;
    }
    
    enemy.style.left = `${x}px`;
    enemy.style.top = `${y}px`;
    
    // Random enemy properties
    const maxHealth = Math.floor(Math.random() * 3) + 2; // 2-4 health
    const enemySpeed = config.baseEnemySpeed + Math.random() * 0.5; // 1.3-1.8 speed
    const goldValue = Math.floor(maxHealth * 1.5) + 3; // More health = more gold
    
    enemies.push({
        element: enemy,
        healthElement: healthBar,
        x: x,
        y: y,
        health: maxHealth,
        maxHealth: maxHealth,
        speed: enemySpeed,
        goldValue: goldValue
    });
}

// Shoot at enemies in range
function shoot() {
    if (!gameActive || enemies.length === 0) return;
    
    // Find enemies in range (even slightly in range counts)
    const towerRect = tower.getBoundingClientRect();
    const towerCenterX = towerRect.left + towerRect.width / 2;
    const towerCenterY = towerRect.top + towerRect.height / 2;
    
    const enemiesInRange = enemies.filter(enemy => {
        const enemyCenterX = enemy.x + config.enemySize/2;
        const enemyCenterY = enemy.y + config.enemySize/2;
        const dx = enemyCenterX - towerCenterX;
        const dy = enemyCenterY - towerCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= towerStats.attackRange + 5; // 5px buffer for partial entry
    });
    
    if (enemiesInRange.length === 0) return;
    
    // Sort by distance to prioritize closest enemies
    enemiesInRange.sort((a, b) => {
        const aDist = Math.sqrt(
            Math.pow(a.x + config.enemySize/2 - towerCenterX, 2) + 
            Math.pow(a.y + config.enemySize/2 - towerCenterY, 2)
        );
        const bDist = Math.sqrt(
            Math.pow(b.x + config.enemySize/2 - towerCenterX, 2) + 
            Math.pow(b.y + config.enemySize/2 - towerCenterY, 2)
        );
        return aDist - bDist;
    });
    
    // Shoot at the closest enemy
    const target = enemiesInRange[0];
    createBullet(target);
    
    // Double shot ability
    if (towerStats.doubleShot && enemiesInRange.length > 1) {
        setTimeout(() => {
            createBullet(enemiesInRange[1]);
        }, 100);
    }
}

// Create a bullet targeting a specific enemy
function createBullet(target) {
    const bullet = document.createElement('div');
    bullet.className = 'bullet';
    gameContainer.appendChild(bullet);
    
    const towerRect = tower.getBoundingClientRect();
    const towerX = towerRect.left + towerRect.width / 2 - config.bulletSize/2;
    const towerY = towerRect.top + towerRect.height / 2 - config.bulletSize/2;
    
    bullet.style.left = `${towerX}px`;
    bullet.style.top = `${towerY}px`;
    
    const angle = Math.atan2(
        target.y + config.enemySize/2 - (towerY + config.bulletSize/2),
        target.x + config.enemySize/2 - (towerX + config.bulletSize/2)
    );
    
    bullets.push({
        element: bullet,
        x: towerX,
        y: towerY,
        speedX: Math.cos(angle) * config.baseBulletSpeed,
        speedY: Math.sin(angle) * config.baseBulletSpeed,
        damage: towerStats.damage
    });
}

// Main game update loop
function update() {
    if (!gameActive) return;
    
    const currentTime = Date.now();
    
    // Spawn enemies at intervals
    if (currentTime - lastSpawnTime > spawnRate) {
        spawnEnemy();
        lastSpawnTime = currentTime;
        
        // Increase difficulty over time
        if (spawnRate > config.minSpawnRate) {
            spawnRate -= 30;
        }
    }
    
    // Update enemy positions
    enemies.forEach((enemy, enemyIndex) => {
        const towerRect = tower.getBoundingClientRect();
        const towerX = towerRect.left + towerRect.width / 2;
        const towerY = towerRect.top + towerRect.height / 2;
        
        // Move enemy toward tower
        const dx = towerX - (enemy.x + config.enemySize/2);
        const dy = towerY - (enemy.y + config.enemySize/2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        enemy.x += (dx / distance) * enemy.speed;
        enemy.y += (dy / distance) * enemy.speed;
        
        enemy.element.style.left = `${enemy.x}px`;
        enemy.element.style.top = `${enemy.y}px`;
        
        // Check collision with tower
        if (distance < (config.towerSize + config.enemySize)/2) {
            towerHealth -= 10;
            updateTowerHealth();
            enemy.element.remove();
            enemies.splice(enemyIndex, 1);
            
            if (towerHealth <= 0) {
                gameOver();
            }
        }
    });
    
    // Update bullet positions
    bullets.forEach((bullet, bulletIndex) => {
        bullet.x += bullet.speedX;
        bullet.y += bullet.speedY;
        
        bullet.element.style.left = `${bullet.x}px`;
        bullet.element.style.top = `${bullet.y}px`;
        
        // Remove bullets that go off-screen
        if (bullet.x < 0 || bullet.x > gameContainer.offsetWidth ||
            bullet.y < 0 || bullet.y > gameContainer.offsetHeight) {
            bullet.element.remove();
            bullets.splice(bulletIndex, 1);
            return;
        }
        
        // Check bullet-enemy collisions
        enemies.forEach((enemy, enemyIndex) => {
            const dx = (enemy.x + config.enemySize/2) - (bullet.x + config.bulletSize/2);
            const dy = (enemy.y + config.enemySize/2) - (bullet.y + config.bulletSize/2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < (config.enemySize + config.bulletSize)/2) {
                enemy.health -= bullet.damage;
                
                // Update health bar
                enemy.healthElement.style.width = `${(enemy.health / enemy.maxHealth) * 100}%`;
                
                if (enemy.health <= 0) {
                    // Add gold when enemy is killed
                    gold += enemy.goldValue;
                    goldElement.textContent = `Gold: ${gold}`;
                    
                    enemy.element.remove();
                    enemies.splice(enemyIndex, 1);
                    score += 10;
                    scoreElement.textContent = `Score: ${score}`;
                }
                
                bullet.element.remove();
                bullets.splice(bulletIndex, 1);
            }
        });
    });
    
    requestAnimationFrame(update);
}

// Update tower health bar display
function updateTowerHealth() {
    const healthBar = document.getElementById('tower-health');
    if (healthBar) {
        healthBar.style.width = `${(towerHealth / config.baseTowerHealth) * 100}%`;
        
        // Change color based on health percentage
        if (towerHealth < config.baseTowerHealth * 0.3) {
            healthBar.style.backgroundColor = '#e74c3c';
        } else if (towerHealth < config.baseTowerHealth * 0.6) {
            healthBar.style.backgroundColor = '#f1c40f';
        } else {
            healthBar.style.backgroundColor = '#2ecc71';
        }
    }
}

// Handle game over
function gameOver() {
    gameActive = false;
    gameOverElement.style.display = 'block';
    finalScoreElement.textContent = score;
    finalGoldElement.textContent = gold;
    
    // Clean up enemies and bullets
    enemies.forEach(enemy => enemy.element.remove());
    bullets.forEach(bullet => bullet.element.remove());
    enemies = [];
    bullets = [];
    
    // Stop shooting
    if (shootIntervalId) {
        clearInterval(shootIntervalId);
        shootIntervalId = null;
    }
}

// Buy tower upgrades
function buyUpgrade(type) {
    const cost = upgradeCosts[type];
    
    if (gold >= cost) {
        gold -= cost;
        goldElement.textContent = `Gold: ${gold}`;
        
        switch (type) {
            case 'range':
                towerStats.attackRange += 30;
                towerStats.rangeLevel++;
                attackRange.style.width = `${towerStats.attackRange * 2}px`;
                attackRange.style.height = `${towerStats.attackRange * 2}px`;
                upgradeCosts.range = Math.floor(upgradeCosts.range * config.upgradeCostMultiplier);
                document.getElementById('range-cost').textContent = upgradeCosts.range;
                break;
                
            case 'damage':
                towerStats.damage += 1;
                towerStats.damageLevel++;
                upgradeCosts.damage = Math.floor(upgradeCosts.damage * config.upgradeCostMultiplier);
                document.getElementById('damage-cost').textContent = upgradeCosts.damage;
                break;
                
            case 'speed':
                towerStats.shootInterval = Math.max(200, towerStats.shootInterval - 100);
                towerStats.speedLevel++;
                upgradeCosts.speed = Math.floor(upgradeCosts.speed * config.upgradeCostMultiplier);
                document.getElementById('speed-cost').textContent = upgradeCosts.speed;
                
                // Restart shooting interval with new speed
                if (shootIntervalId) {
                    clearInterval(shootIntervalId);
                }
                shootIntervalId = setInterval(shoot, towerStats.shootInterval);
                break;
                
            case 'double':
                towerStats.doubleShot = true;
                towerStats.doubleShotPurchased = true;
                document.getElementById('double-cost').textContent = "MAX";
                document.querySelector('[onclick="buyUpgrade(\'double\')"]').style.backgroundColor = "#95a5a6";
                document.querySelector('[onclick="buyUpgrade(\'double\')"]').style.cursor = "default";
                break;
        }
    } else {
        alert("Not enough gold!");
    }
}

// Start a new game
function startGame() {
    score = 0;
    gold = 0;
    gameActive = true;
    enemies = [];
    bullets = [];
    spawnRate = config.initialSpawnRate;
    lastSpawnTime = Date.now();
    towerHealth = config.baseTowerHealth;
    
    // Reset tower stats
    towerStats = {
        attackRange: config.baseAttackRange,
        damage: config.baseDamage,
        shootInterval: config.baseShootInterval,
        doubleShot: false,
        rangeLevel: 1,
        damageLevel: 1,
        speedLevel: 1,
        doubleShotPurchased: false
    };
    
    // Reset upgrade costs
    upgradeCosts = {
        range: 50,
        damage: 75,
        speed: 100,
        double: 150
    };
    
    // Update UI
    scoreElement.textContent = `Score: ${score}`;
    goldElement.textContent = `Gold: ${gold}`;
    gameOverElement.style.display = 'none';
    
    // Reset upgrade menu
    document.getElementById('range-cost').textContent = upgradeCosts.range;
    document.getElementById('damage-cost').textContent = upgradeCosts.damage;
    document.getElementById('speed-cost').textContent = upgradeCosts.speed;
    document.getElementById('double-cost').textContent = upgradeCosts.double;
    
    const doubleOption = document.querySelector('[onclick="buyUpgrade(\'double\')"]');
    doubleOption.style.backgroundColor = "#ecf0f1";
    doubleOption.style.cursor = "pointer";
    
    // Create or reset tower health bar
    const existingHealthBar = document.getElementById('tower-health');
    if (!existingHealthBar) {
        createTowerHealthBar();
    }
    updateTowerHealth();
    
    // Set attack range display
    attackRange.style.width = `${towerStats.attackRange * 2}px`;
    attackRange.style.height = `${towerStats.attackRange * 2}px`;
    
    // Start shooting
    if (shootIntervalId) {
        clearInterval(shootIntervalId);
    }
    shootIntervalId = setInterval(shoot, towerStats.shootInterval);
    
    // Start game loop
    update();
}

// Event listeners
upgradeBtn.addEventListener('click', () => {
    if (gameActive) {
        upgradeMenu.style.display = 'block';
    }
});

document.getElementById('close-upgrades').addEventListener('click', () => {
    upgradeMenu.style.display = 'none';
});

restartBtn.addEventListener('click', startGame);

// Start game when page loads
window.addEventListener('load', startGame);