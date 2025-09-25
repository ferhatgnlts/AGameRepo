document.addEventListener("DOMContentLoaded", function() {
     const gameContainer = document.getElementById("game-container");
     const scoreElement = document.getElementById("score");
     const livesElement = document.getElementById("lives");
     const finalScoreElement = document.getElementById("final-score");
     const startScreen = document.getElementById("start-screen");
     const gameOverScreen = document.getElementById("game-over");
     const startButton = document.getElementById("start-button");
     const restartButton = document.getElementById("restart-button");
     const comboElement = document.getElementById("combo");
     
     let score = 0;
     let lives = 3;
     let gameActive = false;
     let fruits = [];
     let gameLoop;
     let spawnLoop;
     let lastX, lastY;
     let combo = 0;
     let lastSliceTime = 0;
     let lastFrameTime = 0;
     const gravity = 0.3;
     
     // Fruit and bomb list
     const fruitTypes = ["🍎", "🍌", "🍇", "🍊", "🍓", "🍉", "🍍", "🥭"];
     const bomb = "💣";
     
     // Object pools
     const fruitPool = [];
     const effectPool = [];
     const particlePool = [];
     
     // Start game
     startButton.addEventListener("click", startGame);
     restartButton.addEventListener("click", startGame);
     
     function startGame() {
         // Set screens
         startScreen.style.display = "none";
         gameOverScreen.style.display = "none";
         gameActive = true;
         
         // Reset score and lives
         score = 0;
         lives = 3;
         combo = 0;
         scoreElement.textContent = `Score: ${score}`;
         livesElement.innerHTML = "❤️ x 3";
         
         // Clear previous fruits
         fruits.forEach(fruit => {
             if (fruit.element && fruit.element.parentNode) {
                 fruit.element.parentNode.removeChild(fruit.element);
                 fruitPool.push(fruit.element);
             }
         });
         fruits = [];
         
         // Clear previous loops
         cancelAnimationFrame(gameLoop);
         clearInterval(spawnLoop);
         
         // Start game loops
         lastFrameTime = performance.now();
         gameLoop = requestAnimationFrame(updateGame);
         spawnLoop = setInterval(spawnFruit, 1000);
     }
     
     function spawnFruit() {
         if (!gameActive || fruits.length > 15) return;
         
         // Randomly select fruit or bomb (low bomb probability)
         const isBomb = Math.random() < 0.12;
         const type = isBomb ? bomb : fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
         
         // Get element from pool or create new
         let fruitElement;
         if (fruitPool.length > 0) {
             fruitElement = fruitPool.pop();
             fruitElement.className = "fruit" + (isBomb ? " bomb" : "");
             fruitElement.textContent = type;
             fruitElement.style.opacity = "1";
             fruitElement.classList.remove("missed");
         } else {
             fruitElement = document.createElement("div");
             fruitElement.className = "fruit" + (isBomb ? " bomb" : "");
             fruitElement.textContent = type;
         }
         
         const fruit = {
             type: type,
             x: Math.random() * (gameContainer.offsetWidth - 50),
             y: gameContainer.offsetHeight, // Start from bottom
             speedY: - (8 + Math.random() * 10), // Upward velocity
             speedX: (Math.random() - 0.5) * 1, // Slight horizontal movement
             rotation: Math.random() * 360,
             rotationSpeed: (Math.random() - 0.5) * 5,
             element: fruitElement,
             isSliced: false,
             missed: false
         };
         
         fruit.element.style.left = fruit.x + "px";
         fruit.element.style.top = fruit.y + "px";
         fruit.element.style.transform = `rotate(${fruit.rotation}deg)`;
         
         gameContainer.appendChild(fruit.element);
         fruits.push(fruit);
     }
     
     function updateGame(timestamp) {
         if (!gameActive) return;
         
         const deltaTime = timestamp - lastFrameTime;
         lastFrameTime = timestamp;
         
         for (let i = fruits.length - 1; i >= 0; i--) {
             const fruit = fruits[i];
             
             if (fruit.isSliced) continue;
             
             // Apply gravity
             fruit.speedY += gravity;
             
             // Update position
             fruit.y += fruit.speedY;
             fruit.x += fruit.speedX;
             fruit.rotation += fruit.rotationSpeed;
             
             // Check if fruit goes above the top
             if (fruit.y < -60) {
                 gameContainer.removeChild(fruit.element);
                 fruitPool.push(fruit.element);
                 fruits.splice(i, 1);
                 continue;
             }
             
             // Check if fruit falls back to bottom without being sliced
             if (fruit.y > gameContainer.offsetHeight - 50 && !fruit.missed && fruit.speedY > 0) {
                 fruit.missed = true;
                 fruit.element.classList.add("missed");
                 
                 // Only reduce life if it"s a fruit (not a bomb)
                 if (fruit.type !== bomb) {
                     reduceLife();
                 }
                 
                 // Remove fruit after animation
                 setTimeout(() => {
                     const index = fruits.indexOf(fruit);
                     if (index > -1 && fruit.element.parentNode) {
                         gameContainer.removeChild(fruit.element);
                         fruitPool.push(fruit.element);
                         fruits.splice(index, 1);
                     }
                 }, 500);
                 continue;
             }
             
             // Update fruit position and rotation
             fruit.element.style.left = fruit.x + "px";
             fruit.element.style.top = fruit.y + "px";
             fruit.element.style.transform = `rotate(${fruit.rotation}deg)`;
         }
         
         gameLoop = requestAnimationFrame(updateGame);
     }
     
     // Listen for touch events
     gameContainer.addEventListener("touchstart", handleTouchStart);
     gameContainer.addEventListener("touchmove", handleTouchMove);
     gameContainer.addEventListener("touchend", handleTouchEnd);
     
     function handleTouchStart(e) {
         if (!gameActive) return;
         
         const touch = e.touches[0];
         const rect = gameContainer.getBoundingClientRect();
         lastX = touch.clientX - rect.left;
         lastY = touch.clientY - rect.top;
         
         checkFruitCut(lastX, lastY);
     }
     
     function handleTouchMove(e) {
         if (!gameActive) return;
         
         e.preventDefault();
         const touch = e.touches[0];
         const rect = gameContainer.getBoundingClientRect();
         const currentX = touch.clientX - rect.left;
         const currentY = touch.clientY - rect.top;
         
         // Draw cut effect
         drawCutEffect(lastX, lastY, currentX, currentY);
         
         // Check for fruit cutting along the line
         checkLineCut(lastX, lastY, currentX, currentY);
         
         lastX = currentX;
         lastY = currentY;
     }
     
     function handleTouchEnd() {
         // Reset combo if too much time between slices
         const currentTime = new Date().getTime();
         if (currentTime - lastSliceTime > 1500 && combo > 0) {
             combo = 0;
         }
     }
     
     function drawCutEffect(x1, y1, x2, y2) {
         // Get element from pool or create new
         let cutEffect;
         if (effectPool.length > 0) {
             cutEffect = effectPool.pop();
         } else {
             cutEffect = document.createElement("div");
             cutEffect.className = "cut-effect";
         }
         
         // Line midpoint
         const midX = (x1 + x2) / 2;
         const midY = (y1 + y2) / 2;
         
         // Line length
         const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
         
         // Line angle
         const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
         
         cutEffect.style.width = length + "px";
         cutEffect.style.left = (midX - length/2) + "px";
         cutEffect.style.top = midY + "px";
         cutEffect.style.transform = `rotate(${angle}deg)`;
         cutEffect.style.opacity = "1";
         
         gameContainer.appendChild(cutEffect);
         
         // Remove effect
         setTimeout(() => {
             cutEffect.style.opacity = "0";
             setTimeout(() => {
                 if (cutEffect.parentNode) {
                     cutEffect.parentNode.removeChild(cutEffect);
                     effectPool.push(cutEffect);
                 }
             }, 200);
         }, 100);
     }
     
     function checkLineCut(x1, y1, x2, y2) {
         // Check for fruit cutting at multiple points along the line
         const steps = 10;
         for (let i = 0; i <= steps; i++) {
             const checkX = x1 + (x2 - x1) * (i / steps);
             const checkY = y1 + (y2 - y1) * (i / steps);
             checkFruitCut(checkX, checkY);
         }
     }
     
     function checkFruitCut(x, y) {
         for (let i = fruits.length - 1; i >= 0; i--) {
             const fruit = fruits[i];
             
             if (fruit.isSliced || fruit.missed) continue;
             
             // Get fruit boundaries
             const fruitRect = fruit.element.getBoundingClientRect();
             const containerRect = gameContainer.getBoundingClientRect();
             
             // Adjust container offset
             const adjustedLeft = fruitRect.left - containerRect.left;
             const adjustedTop = fruitRect.top - containerRect.top;
             
             // Check if touch point is inside the fruit
             if (x >= adjustedLeft && x <= adjustedLeft + fruitRect.width && 
                 y >= adjustedTop && y <= adjustedTop + fruitRect.height) {
                 
                 // If bomb is sliced, reduce life
                 if (fruit.type === bomb) {
                     reduceLife();
                     createExplosion(adjustedLeft + fruitRect.width/2, adjustedTop + fruitRect.height/2, true);
                     fruit.isSliced = true;
                     gameContainer.removeChild(fruit.element);
                     fruitPool.push(fruit.element);
                     fruits.splice(i, 1);
                     return;
                 }
                 
                 // Slice the fruit
                 sliceFruit(i);
             }
         }
     }
     
     function sliceFruit(index) {
         const fruit = fruits[index];
         fruit.isSliced = true;
         
         // Update combo
         const currentTime = new Date().getTime();
         if (currentTime - lastSliceTime < 500) {
             combo++;
             if (combo > 1) {
                 showCombo(combo, fruit.x + 25, fruit.y + 25);
             }
         } else {
             combo = 1;
         }
         lastSliceTime = currentTime;
         
         // Increase score based on combo
         const points = 10 * combo;
         score += points;
         scoreElement.textContent = `Score: ${score}`;
         
         // Create explosion effect
         const fruitRect = fruit.element.getBoundingClientRect();
         const containerRect = gameContainer.getBoundingClientRect();
         const adjustedLeft = fruitRect.left - containerRect.left;
         const adjustedTop = fruitRect.top - containerRect.top;
         
         createExplosion(adjustedLeft + fruitRect.width/2, adjustedTop + fruitRect.height/2, false, fruit.type);
         
         // Remove fruit
         fruit.element.classList.add("sliced");
         setTimeout(() => {
             if (fruit.element.parentNode) {
                 fruit.element.parentNode.removeChild(fruit.element);
                 fruitPool.push(fruit.element);
             }
             fruits.splice(index, 1);
         }, 300);
     }
     
     function createExplosion(x, y, isBomb, type = null) {
         if (isBomb) {
             // Bomb explosion
             const explosion = document.createElement("div");
             explosion.className = "fruit";
             explosion.style.left = x + "px";
             explosion.style.top = y + "px";
             explosion.textContent = "💥";
             explosion.style.fontSize = "60px";
             explosion.style.transform = "scale(0)";
             explosion.style.transition = "all 0.5s";
             explosion.style.zIndex = "20";
             
             gameContainer.appendChild(explosion);
             
             // Animate explosion
             setTimeout(() => {
                 explosion.style.transform = "scale(1.5)";
                 explosion.style.opacity = "0";
             }, 10);
             
             setTimeout(() => {
                 if (explosion.parentNode) {
                     explosion.parentNode.removeChild(explosion);
                 }
             }, 500);
         } else {
             // Fruit explosion - fewer particles and simpler animation
             for (let i = 0; i < 5; i++) {
                 // Get particle from pool or create new
                 let particle;
                 if (particlePool.length > 0) {
                     particle = particlePool.pop();
                     particle.textContent = type || fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
                     particle.style.opacity = "1";
                 } else {
                     particle = document.createElement("div");
                     particle.className = "particle";
                     particle.textContent = type || fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
                 }
                 
                 particle.style.left = x + "px";
                 particle.style.top = y + "px";
                 particle.style.fontSize = "20px";
                 
                 // Random direction and speed
                 const angle = Math.random() * Math.PI * 2;
                 const speed = 3 + Math.random() * 4;
                 const dx = Math.cos(angle) * speed;
                 const dy = Math.sin(angle) * speed;
                 
                 gameContainer.appendChild(particle);
                 
                 // Particle animation
                 let lifeTime = 0;
                 const particleInterval = setInterval(() => {
                     lifeTime++;
                     const newX = parseFloat(particle.style.left) + dx;
                     const newY = parseFloat(particle.style.top) + dy;
                     
                     particle.style.left = newX + "px";
                     particle.style.top = newY + "px";
                     particle.style.opacity = 1 - (lifeTime / 20);
                     particle.style.transform = `rotate(${lifeTime * 10}deg)`;
                     
                     if (lifeTime > 20) {
                         clearInterval(particleInterval);
                         particle.style.opacity = "0";
                         if (particle.parentNode) {
                             particle.parentNode.removeChild(particle);
                             particlePool.push(particle);
                         }
                     }
                 }, 30);
             }
         }
     }
     
     function showCombo(comboCount, x, y) {
         comboElement.textContent = `Combo x${comboCount}!`;
         comboElement.style.left = x + "px";
         comboElement.style.top = y + "px";
         comboElement.style.opacity = "1";
         
         // Animate combo text
         comboElement.animate([
             { transform: "translate(-50%, -50%) scale(0.5)", opacity: 0 },
             { transform: "translate(-50%, -50%) scale(1.2)", opacity: 1 },
             { transform: "translate(-50%, -100%) scale(1)", opacity: 0 }
         ], {
             duration: 1000,
             easing: "ease-out"
         });
         
         setTimeout(() => {
             comboElement.style.opacity = "0";
         }, 1000);
     }
     
     function reduceLife() {
         lives--;
         livesElement.innerHTML = `❤️ x ${lives}`;
         
         if (lives <= 0) {
             gameOver();
         }
     }
     
     function gameOver() {
         gameActive = false;
         cancelAnimationFrame(gameLoop);
         clearInterval(spawnLoop);
         
         finalScoreElement.textContent = score;
         gameOverScreen.style.display = "flex";
         
         // Clear all fruits
         setTimeout(() => {
             fruits.forEach(fruit => {
                 if (fruit.element && fruit.element.parentNode) {
                     fruit.element.parentNode.removeChild(fruit.element);
                     fruitPool.push(fruit.element);
                 }
             });
             fruits = [];
         }, 500);
     }
 });