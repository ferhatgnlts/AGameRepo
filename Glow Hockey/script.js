window.addEventListener('load', function() {
    
    // Game elements
    const gameCanvas = document.getElementById('gameCanvas');
    const gameContext = gameCanvas.getContext('2d');
    
    // Game state object
    const gameState = {
        playerPaddle: { xPosition: 0, yPosition: 0, radius: 30, score: 0 },
        aiPaddle: { xPosition: 0, yPosition: 0, radius: 30, score: 0 },
        gameBall: { 
            xPosition: 0, 
            yPosition: 0, 
            radius: 15, 
            velocityX: 0, 
            velocityY: 0,
            maxSpeed: 14,
            minSpeed: 8
        },
        isGameRunning: false,
        isGameStarted: false,
        isPaused: false,
        winningScore: 7,
        lastScorer: null,
        aiDifficulty: 0.7,
        ballGlowEffect: 0
    };
    
    // Adjust canvas size to fit container
    function resizeGameCanvas() {
        const gameContainer = document.querySelector('.game-container');
        gameCanvas.width = gameContainer.clientWidth;
        gameCanvas.height = gameContainer.clientHeight;
        
        // Position game objects after resize
        gameState.playerPaddle.xPosition = gameCanvas.width / 2;
        gameState.playerPaddle.yPosition = gameCanvas.height * 0.85;
        gameState.aiPaddle.xPosition = gameCanvas.width / 2;
        gameState.aiPaddle.yPosition = gameCanvas.height * 0.15;
        resetBallPosition();
    }
    
    // Reset ball to center position
    function resetBallPosition() {
        gameState.gameBall.xPosition = gameCanvas.width / 2;
        gameState.gameBall.yPosition = gameCanvas.height / 2;
        gameState.gameBall.velocityX = 0;
        gameState.gameBall.velocityY = 0;
        gameState.ballGlowEffect = 0;
    }
    
    // Initialize canvas size and handle window resize
    resizeGameCanvas();
    window.addEventListener('resize', resizeGameCanvas);
    
    // Reset ball and determine next server
    function resetBall(nextServer = null) {
        resetBallPosition();
        gameState.isGameRunning = false;
        const gameStatusElement = document.getElementById('gameStatus');
        
        // Default Player Color
        gameStatusElement.style.color = '#ff0066';
        gameStatusElement.style.borderColor = '#ff0066';
        gameStatusElement.style.boxShadow = '0 0 25px rgba(255, 0, 102, 0.3)';
        gameStatusElement.classList.remove('ai-serve');
        
        if (nextServer === 'player') {
            gameStatusElement.textContent = 'Touch the ball to serve!';
            gameStatusElement.style.display = 'block';
            gameStatusElement.style.top = "70%";
        } else if (nextServer === 'ai') {
            gameStatusElement.textContent = 'Computer serves next...';
            gameStatusElement.style.display = 'block';
            gameStatusElement.style.top = "30%";
            
            // Set AI Color
            gameStatusElement.style.color = '#00ff66';
            gameStatusElement.style.borderColor = '#00ff66';
            gameStatusElement.style.boxShadow = '0 0 25px rgba(0, 255, 102, 0.3)';
            gameStatusElement.classList.add('ai-serve');
            
            // AI serves after a short delay
            setTimeout(() => {
                if (!gameState.isGameRunning && !gameState.isPaused) {
                    startBallMovement('ai');
                }
            }, 1500);
        } else {
            gameStatusElement.textContent = 'Touch the ball to start!';
            gameStatusElement.style.display = 'block';
        }
    }
    
    // Start ball movement with initial velocity
    function startBallMovement(server) {
        const randomAngle = (Math.random() - 0.5) * Math.PI / 4;
        const initialSpeed = gameState.gameBall.minSpeed;
        
        if (server === 'player') {
            gameState.gameBall.velocityX = Math.sin(randomAngle) * initialSpeed;
            gameState.gameBall.velocityY = -Math.cos(randomAngle) * initialSpeed;
        } else {
            gameState.gameBall.velocityX = Math.sin(randomAngle) * initialSpeed;
            gameState.gameBall.velocityY = Math.cos(randomAngle) * initialSpeed;
        }
        
        gameState.isGameRunning = true;
        gameState.isGameStarted = true;
        document.getElementById('gameStatus').style.display = 'none';
    }
    
    // Draw the game field with neon borders
    function drawGameField() {
        // Black background
        gameContext.fillStyle = '#000000';
        gameContext.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
        
        // Neon border effect
        const borderGradient = gameContext.createLinearGradient(0, 0, gameCanvas.width, 0);
        borderGradient.addColorStop(0, '#4CC2A7');
        borderGradient.addColorStop(0.5, '#000000');
        borderGradient.addColorStop(1, '#6B45DB');
        
        gameContext.strokeStyle = borderGradient;
        gameContext.lineWidth = 8;
        gameContext.strokeRect(0, 0, gameCanvas.width, gameCanvas.height);
        
        // Center line with dashed effect
        gameContext.strokeStyle = '#AAAAAA';
        gameContext.lineWidth = 4;
        gameContext.setLineDash([15, 15]);
        gameContext.beginPath();
        gameContext.moveTo(20, gameCanvas.height / 2);
        gameContext.lineTo(gameCanvas.width - 20, gameCanvas.height / 2);
        gameContext.stroke();
        gameContext.setLineDash([]);
        
        // Center circle
        gameContext.beginPath();
        gameContext.arc(gameCanvas.width / 2, gameCanvas.height / 2, 60, 0, Math.PI * 2);
        gameContext.stroke();
        
        // Goals
        const goalWidth = gameCanvas.width * 0.5;
        const goalX = (gameCanvas.width - goalWidth) / 2;
        
        // AI goal (top) - AI Color
        gameContext.strokeStyle = '#00ff66'; // AI rengi
        gameContext.lineWidth = 7;
        gameContext.strokeRect(goalX, 0, goalWidth, 25);
        gameContext.fillStyle = 'rgba(0, 255, 102, 0.1)';
        gameContext.fillRect(goalX, 0, goalWidth, 25);
        
        // Player goal (bottom) - Player Color
        gameContext.strokeStyle = '#ff0066'; // Oyuncu rengi
        gameContext.strokeRect(goalX, gameCanvas.height - 25, goalWidth, 25);
        gameContext.fillStyle = 'rgba(255, 0, 102, 0.1)';
        gameContext.fillRect(goalX, gameCanvas.height - 25, goalWidth, 25);
    }
    
    // Draw a paddle with glow effect
    function drawPaddle(paddle, color, isPlayer = false) {
        // Outer glow
        gameContext.shadowColor = color;
        gameContext.shadowBlur = 20;
        
        // Main paddle body
        gameContext.fillStyle = color;
        gameContext.beginPath();
        gameContext.arc(paddle.xPosition, paddle.yPosition, paddle.radius, 0, Math.PI * 2);
        gameContext.fill();
        
        // Inner ring
        gameContext.strokeStyle = '#FFFFFF';
        gameContext.lineWidth = 6;
        gameContext.beginPath();
        gameContext.arc(paddle.xPosition, paddle.yPosition, paddle.radius - 8, 0, Math.PI * 2);
        gameContext.stroke();
        
        // Center dot
        gameContext.fillStyle = '#000000';
        gameContext.beginPath();
        gameContext.arc(paddle.xPosition, paddle.yPosition, 7, 0, Math.PI * 2);
        gameContext.fill();
        
        gameContext.shadowBlur = 0;
    }
    
    // Draw the ball with pulsing glow effect
    function drawBall() {
        gameState.ballGlowEffect += 0.1;
        const glowIntensity = Math.sin(gameState.ballGlowEffect) * 10 + 15;
        
        // Ball glow effect
        gameContext.shadowColor = '#ffff00';
        gameContext.shadowBlur = glowIntensity;
        
        // Main ball
        gameContext.fillStyle = '#ffff00';
        gameContext.beginPath();
        gameContext.arc(gameState.gameBall.xPosition, gameState.gameBall.yPosition, gameState.gameBall.radius, 0, Math.PI * 2);
        gameContext.fill();
        
        // Ball border
        gameContext.strokeStyle = '#ffaa00';
        gameContext.lineWidth = 3;
        gameContext.stroke();
        
        // Ball highlight
        gameContext.fillStyle = '#ffffff';
        gameContext.beginPath();
        gameContext.arc(gameState.gameBall.xPosition - 4, gameState.gameBall.yPosition - 4, 4, 0, Math.PI * 2);
        gameContext.fill();
        
        gameContext.shadowBlur = 0;
    }
    
    // Update ball position and handle collisions
    function updateBallPosition() {
        if (!gameState.isGameRunning || gameState.isPaused) return;
        
        gameState.gameBall.xPosition += gameState.gameBall.velocityX;
        gameState.gameBall.yPosition += gameState.gameBall.velocityY;
        
        // Side wall collisions
        if (gameState.gameBall.xPosition <= gameState.gameBall.radius || 
            gameState.gameBall.xPosition >= gameCanvas.width - gameState.gameBall.radius) {
            gameState.gameBall.velocityX *= -0.9;
            gameState.gameBall.xPosition = Math.max(gameState.gameBall.radius, 
                Math.min(gameCanvas.width - gameState.gameBall.radius, gameState.gameBall.xPosition));
        }
        
        const goalWidth = gameCanvas.width * 0.5;
        const goalX = (gameCanvas.width - goalWidth) / 2;
        
        // Top goal check (AI scores)
        if (gameState.gameBall.yPosition <= gameState.gameBall.radius) {
            if (gameState.gameBall.xPosition >= goalX && gameState.gameBall.xPosition <= goalX + goalWidth) {
                gameState.playerPaddle.score++;
                gameState.lastScorer = 'player';
                updateScoreDisplay();
                if (gameState.playerPaddle.score >= gameState.winningScore) {
                    endGame('Player Wins!');
                } else {
                    resetBall('ai'); // Player scored, so AI serves next
                }
            } else {
                gameState.gameBall.velocityY *= -0.9;
                gameState.gameBall.yPosition = gameState.gameBall.radius;
            }
        }
        
        // Bottom goal check (Player scores)  
        if (gameState.gameBall.yPosition >= gameCanvas.height - gameState.gameBall.radius) {
            if (gameState.gameBall.xPosition >= goalX && gameState.gameBall.xPosition <= goalX + goalWidth) {
                gameState.aiPaddle.score++;
                gameState.lastScorer = 'ai';
                updateScoreDisplay();
                if (gameState.aiPaddle.score >= gameState.winningScore) {
                    endGame('Computer Wins!');
                } else {
                    resetBall('player'); // AI scored, so Player serves next
                }
            } else {
                gameState.gameBall.velocityY *= -0.9;
                gameState.gameBall.yPosition = gameCanvas.height - gameState.gameBall.radius;
            }
        }
    }
    
    // Check for collision between ball and paddle
    function checkPaddleCollision(paddle) {
        if (!gameState.isGameRunning || gameState.isPaused) return;
        
        const deltaX = gameState.gameBall.xPosition - paddle.xPosition;
        const deltaY = gameState.gameBall.yPosition - paddle.yPosition;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance < gameState.gameBall.radius + paddle.radius) {
            const collisionAngle = Math.atan2(deltaY, deltaX);
            const currentSpeed = Math.sqrt(
                gameState.gameBall.velocityX * gameState.gameBall.velocityX + 
                gameState.gameBall.velocityY * gameState.gameBall.velocityY
            );
            const newSpeed = Math.min(currentSpeed * 1.15, gameState.gameBall.maxSpeed);
            
            gameState.gameBall.velocityX = Math.cos(collisionAngle) * newSpeed;
            gameState.gameBall.velocityY = Math.sin(collisionAngle) * newSpeed;
            
            const overlap = gameState.gameBall.radius + paddle.radius - distance;
            gameState.gameBall.xPosition += Math.cos(collisionAngle) * overlap;
            gameState.gameBall.yPosition += Math.sin(collisionAngle) * overlap;
        }
    }
    
    // Update AI paddle position with difficulty adjustment
    function updateAIPaddle() {
        if (!gameState.isGameRunning || gameState.isPaused) return;
        
        const aiSpeed = 7;
        const predictionFactor = 0.4;
        
        let targetX = gameState.gameBall.xPosition;
        
        // Predict ball movement for better AI
        if (gameState.gameBall.velocityY < 0 && gameState.gameBall.yPosition < gameCanvas.height * 0.7) {
            const timeToReach = Math.abs(gameState.gameBall.yPosition - gameState.aiPaddle.yPosition) / 
                Math.abs(gameState.gameBall.velocityY);
            targetX = gameState.gameBall.xPosition + (gameState.gameBall.velocityX * timeToReach * predictionFactor);
            
            // Add some randomness to make AI beatable
            targetX += (Math.random() - 0.5) * 100 * (1 - gameState.aiDifficulty);
        }
        
        const distance = targetX - gameState.aiPaddle.xPosition;
        
        if (Math.abs(distance) > 5) {
            const moveSpeed = Math.min(aiSpeed * gameState.aiDifficulty, Math.abs(distance) * 0.3);
            if (distance > 0) {
                gameState.aiPaddle.xPosition += moveSpeed;
            } else {
                gameState.aiPaddle.xPosition -= moveSpeed;
            }
        }
        
        // Keep AI in bounds
        gameState.aiPaddle.xPosition = Math.max(
            gameState.aiPaddle.radius, 
            Math.min(gameCanvas.width - gameState.aiPaddle.radius, gameState.aiPaddle.xPosition)
        );
        gameState.aiPaddle.yPosition = Math.max(
            gameState.aiPaddle.radius + 30, 
            Math.min(gameCanvas.height / 2 - 60, gameState.aiPaddle.yPosition)
        );
    }
    
    // Handle user input for paddle movement
    function handleUserInput(inputX, inputY) {
        // Check if clicking/touching the ball to start
        if (!gameState.isGameRunning && !gameState.isPaused) {
            const distanceToBall = Math.sqrt(
                Math.pow(inputX - gameState.gameBall.xPosition, 2) + 
                Math.pow(inputY - gameState.gameBall.yPosition, 2)
            );
            
            if (distanceToBall < gameState.gameBall.radius + 30) {
                startBallMovement('player');
                return;
            }
        }
        
        // Move player paddle (only in bottom half)
        if (inputY > gameCanvas.height / 2 && !gameState.isPaused) {
            gameState.playerPaddle.xPosition = inputX;
            gameState.playerPaddle.yPosition = inputY;
            
            gameState.playerPaddle.xPosition = Math.max(
                gameState.playerPaddle.radius, 
                Math.min(gameCanvas.width - gameState.playerPaddle.radius, gameState.playerPaddle.xPosition)
            );
            gameState.playerPaddle.yPosition = Math.max(
                gameCanvas.height / 2 + 60, 
                Math.min(gameCanvas.height - gameState.playerPaddle.radius - 30, gameState.playerPaddle.yPosition)
            );
        }
    }
    
    // Touch events for mobile devices
    gameCanvas.addEventListener('touchstart', (event) => {
        event.preventDefault();
        const canvasRect = gameCanvas.getBoundingClientRect();
        const touch = event.touches[0];
        const inputX = (touch.clientX - canvasRect.left) * (gameCanvas.width / canvasRect.width);
        const inputY = (touch.clientY - canvasRect.top) * (gameCanvas.height / canvasRect.height);
        handleUserInput(inputX, inputY);
    });
    
    gameCanvas.addEventListener('touchmove', (event) => {
        event.preventDefault();
        const canvasRect = gameCanvas.getBoundingClientRect();
        const touch = event.touches[0];
        const inputX = (touch.clientX - canvasRect.left) * (gameCanvas.width / canvasRect.width);
        const inputY = (touch.clientY - canvasRect.top) * (gameCanvas.height / canvasRect.height);
        handleUserInput(inputX, inputY);
    });
    
    // Mouse events for desktop
    gameCanvas.addEventListener('mousedown', (event) => {
        const canvasRect = gameCanvas.getBoundingClientRect();
        const inputX = (event.clientX - canvasRect.left) * (gameCanvas.width / canvasRect.width);
        const inputY = (event.clientY - canvasRect.top) * (gameCanvas.height / canvasRect.height);
        handleUserInput(inputX, inputY);
    });
    
    gameCanvas.addEventListener('mousemove', (event) => {
        const canvasRect = gameCanvas.getBoundingClientRect();
        const inputX = (event.clientX - canvasRect.left) * (gameCanvas.width / canvasRect.width);
        const inputY = (event.clientY - canvasRect.top) * (gameCanvas.height / canvasRect.height);
        
        if (inputY > gameCanvas.height / 2) {
            handleUserInput(inputX, inputY);
        }
    });
    
    // Update score display
    function updateScoreDisplay() {
        document.getElementById('playerScore').textContent = gameState.playerPaddle.score;
        document.getElementById('aiScore').textContent = gameState.aiPaddle.score;
    }
    
    // End game and show winner
    function endGame(winnerText) {
        gameState.isGameRunning = false;
        document.getElementById('winnerText').textContent = winnerText;
        document.getElementById('gameOver').style.display = 'flex';
    }
    
    // Restart game with initial state
    function restartGame() {
        gameState.playerPaddle.score = 0;
        gameState.aiPaddle.score = 0;
        gameState.playerPaddle.xPosition = gameCanvas.width / 2;
        gameState.playerPaddle.yPosition = gameCanvas.height * 0.85;
        gameState.aiPaddle.xPosition = gameCanvas.width / 2;
        gameState.aiPaddle.yPosition = gameCanvas.height * 0.15;
        gameState.isGameStarted = false;
        gameState.isPaused = false;
        gameState.lastScorer = null;
        resetBall();
        updateScoreDisplay();
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('pause-btn').textContent = 'Pause';
    }
    
    // Toggle pause state
    function togglePause() {
        gameState.isPaused = !gameState.isPaused;
        const pauseBtn = document.getElementById('pause-btn');
        
        if (gameState.isPaused) {
            pauseBtn.textContent = 'Resume';
            document.getElementById('gameStatus').textContent = 'Game Paused';
            document.getElementById('gameStatus').style.display = 'block';
            document.getElementById('gameStatus').style.top = '50%';
        } else {
            pauseBtn.textContent = 'Pause';
            document.getElementById('gameStatus').style.display = 'none';
        }
    }
    
    // Main game loop
    function gameLoop() {
        if (!gameState.isPaused) {
            updateBallPosition();
            updateAIPaddle();
            checkPaddleCollision(gameState.playerPaddle);
            checkPaddleCollision(gameState.aiPaddle);
        }
        
        // Clear canvas
        gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        
        // Draw all game elements
        drawGameField();
        drawPaddle(gameState.playerPaddle, '#ff0066', true); // Oyuncu rengi
        drawPaddle(gameState.aiPaddle, '#00ff66', false); // AI rengi
        drawBall();
        
        requestAnimationFrame(gameLoop);
    }
    
    // Add event listeners for control buttons
    const pauseButton = document.getElementById('pause-btn');
    pauseButton.addEventListener('click', function() {
        if (gameState.isGameStarted) {
            togglePause();
        }
    });
    
    const restartButton = document.getElementById('restart-btn');
    restartButton.addEventListener('click', function() {
        restartGame();
    });
    
    const gameRestartButton = document.getElementById('restart-game');
    gameRestartButton.addEventListener('click', function() {
        restartGame();
    });
    
    // Initialize game
    updateScoreDisplay();
    resetBall();
    gameLoop();
});