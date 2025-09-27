// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const resultDisplay = document.getElementById('result');
const resetButton = document.getElementById('resetButton');
const turnIndicator = document.getElementById('turnIndicator');
const aiDifficulty = document.getElementById('aiDifficulty');
const insaneWarning = document.getElementById('insaneWarning');

const boardSize = 3;
let board = Array(boardSize * boardSize).fill(null);
let currentPlayer = 'X'; // Human is X, AI is O
let gameActive = true;
let animationInProgress = false;
let lastMoveIndex = -1;
let animationType = ''; // 'X' or 'O'
let animationStep = 0;
let animationProgress = 0;
let firstLineDrawn = false; // Track if the first line of X is drawn

// Show/hide insane warning based on selected difficulty
function updateInsaneWarning() {
    if (aiDifficulty.value === 'insane') {
        insaneWarning.style.display = 'block';
    } else {
        insaneWarning.style.display = 'none';
    }
}

// Set canvas size based on screen
function setCanvasSize() {
    const containerWidth = document.querySelector('.game-area').offsetWidth;
    const maxSize = Math.min(containerWidth, 400);
    canvas.width = maxSize;
    canvas.height = maxSize;
    drawBoard();
}

// Draw the game board
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines with glow effect
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    
    // Vertical lines
    for (let i = 1; i < boardSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * (canvas.width / boardSize), 0);
        ctx.lineTo(i * (canvas.width / boardSize), canvas.height);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = 1; i < boardSize; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * (canvas.height / boardSize));
        ctx.lineTo(canvas.width, i * (canvas.height / boardSize));
        ctx.stroke();
    }
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Draw X's and O's
    for (let i = 0; i < board.length; i++) {
        if (board[i]) {
            const row = Math.floor(i / boardSize);
            const col = i % boardSize;
            const cellWidth = canvas.width / boardSize;
            const cellHeight = canvas.height / boardSize;
            
            const x = col * cellWidth + cellWidth / 2;
            const y = row * cellHeight + cellHeight / 2;
            const radius = Math.min(cellWidth, cellHeight) / 3;
            
            // Draw with animation if it's the last move
            if (i === lastMoveIndex && animationInProgress) {
                if (board[i] === 'X') {
                    drawAnimatedX(x, y, radius, animationProgress, animationStep);
                } else if (board[i] === 'O') {
                    drawAnimatedO(x, y, radius, animationProgress);
                }
            } else {
                // Draw completed symbol
                if (board[i] === 'X') {
                    drawX(x, y, radius);
                } else if (board[i] === 'O') {
                    drawO(x, y, radius);
                }
            }
        }
    }
    
    // Continue animation if in progress
    if (animationInProgress) {
        if (animationType === 'X') {
            // X animation: first line then second line
            if (animationStep === 0 && animationProgress < 1) {
                animationProgress += 0.08;
            } else if (animationStep === 0 && animationProgress >= 1) {
                animationStep = 1;
                animationProgress = 0;
                firstLineDrawn = true; // Mark first line as drawn
            } else if (animationStep === 1 && animationProgress < 1) {
                animationProgress += 0.08;
            } else if (animationStep === 1 && animationProgress >= 1) {
                animationInProgress = false;
                animationStep = 0;
                firstLineDrawn = false; // Reset for next X
                checkGameState();
            }
        } else if (animationType === 'O') {
            // O animation: continuous circle drawing
            if (animationProgress < 1) {
                animationProgress += 0.05;
            } else {
                animationInProgress = false;
                checkGameState();
            }
        }
        
        if (animationInProgress) {
            requestAnimationFrame(drawBoard);
        }
    }
}

// Draw completed X
function drawX(x, y, radius) {
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(248, 113, 113, 0.7)';
    
    ctx.beginPath();
    ctx.moveTo(x - radius, y - radius);
    ctx.lineTo(x + radius, y + radius);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x + radius, y - radius);
    ctx.lineTo(x - radius, y + radius);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
}

// Draw completed O
function drawO(x, y, radius) {
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 8;
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(74, 222, 128, 0.7)';
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
}

// Draw animated X
function drawAnimatedX(x, y, radius, progress, step) {
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(248, 113, 113, 0.7)';
    
    // Always draw the first line if it's been completed
    if (firstLineDrawn || step === 1) {
        ctx.beginPath();
        ctx.moveTo(x - radius, y - radius);
        ctx.lineTo(x + radius, y + radius);
        ctx.stroke();
    }
    
    if (step === 0) {
        // First diagonal line - animating
        ctx.beginPath();
        ctx.moveTo(x - radius, y - radius);
        ctx.lineTo(
            x - radius + (2 * radius * progress),
            y - radius + (2 * radius * progress)
        );
        ctx.stroke();
    } else {
        // Second diagonal line - animating
        ctx.beginPath();
        ctx.moveTo(x + radius, y - radius);
        ctx.lineTo(
            x + radius - (2 * radius * progress),
            y - radius + (2 * radius * progress)
        );
        ctx.stroke();
    }
    
    ctx.shadowBlur = 0;
}

// Draw animated O
function drawAnimatedO(x, y, radius, progress) {
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 8;
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(74, 222, 128, 0.7)';
    
    // Draw circle with gap to simulate drawing animation
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (Math.PI * 2 * progress);
    
    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, endAngle);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
}

// Check for a winner
function checkWinner() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    
    return board.includes(null) ? null : 'T'; // T for tie
}

// AI move with difficulty levels
function aiMove() {
    const difficulty = aiDifficulty.value;
    let move;
    
    if (difficulty === 'easy') {
        // Easy AI - makes random moves with occasional strategy
        move = easyAIMove();
    } else if (difficulty === 'medium') {
        // Medium AI - uses basic strategy with occasional mistakes
        move = mediumAIMove();
    } else if (difficulty === 'hard') {
        // Hard AI - uses minimax but with occasional suboptimal moves
        move = hardAIMove();
    } else {
        // Insane AI - perfect play using minimax
        move = insaneAIMove();
    }
    
    board[move] = 'O';
    lastMoveIndex = move;
    currentPlayer = 'X';
    animationType = 'O';
}

// Easy AI - mostly random with occasional strategy
function easyAIMove() {
    // 30% chance to make a strategic move
    if (Math.random() < 0.3) {
        // Try to win
        let move = findWinningMove('O');
        if (move !== -1) return move;
        
        // Block player from winning
        move = findWinningMove('X');
        if (move !== -1) return move;
    }
    
    // Otherwise make a random move
    return getRandomMove();
}

// Medium AI - basic strategy with occasional mistakes
function mediumAIMove() {
    // 80% chance to make a strategic move
    if (Math.random() < 0.8) {
        // Try to win
        let move = findWinningMove('O');
        if (move !== -1) return move;
        
        // Block player from winning
        move = findWinningMove('X');
        if (move !== -1) return move;
        
        // Take center if available
        if (board[4] === null) return 4;
        
        // Take a corner if available
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(i => board[i] === null);
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }
    }
    
    // Otherwise make a random move (20% chance of mistake)
    return getRandomMove();
}

// Hard AI - uses minimax but with occasional suboptimal moves
function hardAIMove() {
    // 90% chance to make the optimal move
    if (Math.random() < 0.9) {
        // Try to win
        let move = findWinningMove('O');
        if (move !== -1) return move;
        
        // Block player from winning
        move = findWinningMove('X');
        if (move !== -1) return move;
        
        // Use minimax for optimal play
        let bestScore = -Infinity;
        let bestMove;
        
        for (let i = 0; i < board.length; i++) {
            if (board[i] === null) {
                board[i] = 'O';
                let score = minimax(board, 0, false);
                board[i] = null;
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        
        return bestMove;
    }
    
    // 10% chance to make a suboptimal move
    return getRandomMove();
}

// Insane AI - perfect play using minimax (no mistakes)
function insaneAIMove() {
    // Always make the optimal move
    // Try to win
    let move = findWinningMove('O');
    if (move !== -1) return move;
    
    // Block player from winning
    move = findWinningMove('X');
    if (move !== -1) return move;
    
    // Use minimax for perfect play
    let bestScore = -Infinity;
    let bestMove;
    
    for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
            board[i] = 'O';
            let score = minimax(board, 0, false);
            board[i] = null;
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    
    return bestMove;
}

// Find a winning move for a player
function findWinningMove(player) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        const cells = [board[a], board[b], board[c]];
        
        // Check if two cells are occupied by the player and one is empty
        if (cells.filter(cell => cell === player).length === 2) {
            if (board[a] === null) return a;
            if (board[b] === null) return b;
            if (board[c] === null) return c;
        }
    }
    
    return -1; // No winning move found
}

// Get a random available move
function getRandomMove() {
    const availableMoves = [];
    for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
            availableMoves.push(i);
        }
    }
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

// Minimax algorithm for optimal play
function minimax(board, depth, isMaximizing) {
    const winner = checkWinner();
    
    if (winner === 'O') return 10 - depth;
    if (winner === 'X') return depth - 10;
    if (winner === 'T') return 0;
    
    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === null) {
                board[i] = 'O';
                let score = minimax(board, depth + 1, false);
                board[i] = null;
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === null) {
                board[i] = 'X';
                let score = minimax(board, depth + 1, true);
                board[i] = null;
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

// Handle player move
function handlePlayerMove(event) {
    if (!gameActive || currentPlayer !== 'X' || animationInProgress) return;
    
    // Get touch position
    let clientX, clientY;
    if (event.type === 'touchstart') {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
        event.preventDefault(); // Prevent scrolling
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const cellWidth = canvas.width / boardSize;
    const cellHeight = canvas.height / boardSize;
    
    const col = Math.floor(x / cellWidth);
    const row = Math.floor(y / cellHeight);
    const index = row * boardSize + col;
    
    if (index >= 0 && index < board.length && board[index] === null) {
        board[index] = 'X';
        lastMoveIndex = index;
        currentPlayer = 'O';
        animationType = 'X';
        
        // Start animation
        animationProgress = 0;
        animationStep = 0;
        animationInProgress = true;
        firstLineDrawn = false;
        turnIndicator.textContent = "AI's Turn (O)";
        turnIndicator.className = "turn-indicator ai-turn";
        
        drawBoard();
    }
}

// Check game state after animation completes
function checkGameState() {
    const winner = checkWinner();
    if (winner) {
        endGame(winner);
    } else if (currentPlayer === 'O') {
        // AI's turn
        setTimeout(aiTurn, 500);
    } else {
        // Player's turn
        turnIndicator.textContent = "Your Turn (X)";
        turnIndicator.className = "turn-indicator your-turn";
    }
}

// AI's turn
function aiTurn() {
    if (!gameActive || currentPlayer !== 'O') return;
    
    aiMove();
    
    // Start animation
    animationProgress = 0;
    animationInProgress = true;
    turnIndicator.textContent = "Your Turn (X)";
    turnIndicator.className = "turn-indicator your-turn";
    
    drawBoard();
}

// End the game
function endGame(winner) {
    gameActive = false;
    animationInProgress = false;
    
    if (winner === 'X') {
        resultDisplay.textContent = "You Win!";
        resultDisplay.className = "result win";
    } else if (winner === 'O') {
        resultDisplay.textContent = "AI Wins!";
        resultDisplay.className = "result lose";
    } else {
        resultDisplay.textContent = "It's a Tie!";
        resultDisplay.className = "result tie";
    }
    
    turnIndicator.textContent = "Game Over";
    turnIndicator.className = "turn-indicator";
}

// Reset the game
function resetGame() {
    board = Array(boardSize * boardSize).fill(null);
    currentPlayer = 'X';
    gameActive = true;
    animationInProgress = false;
    resultDisplay.textContent = "";
    resultDisplay.className = "result";
    turnIndicator.textContent = "Your Turn (X)";
    turnIndicator.className = "turn-indicator your-turn";
    setCanvasSize();
}

// Event listeners
canvas.addEventListener('click', handlePlayerMove);
canvas.addEventListener('touchstart', handlePlayerMove, { passive: false });
resetButton.addEventListener('click', resetGame);
aiDifficulty.addEventListener('change', updateInsaneWarning);

// Only prevent default for the reset button, not the select element
resetButton.addEventListener('mousedown', (e) => e.preventDefault());

// Handle window resize
window.addEventListener('resize', setCanvasSize);

// Initialize the game
setCanvasSize();
updateInsaneWarning();