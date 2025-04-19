const board = document.getElementById('board');
const statusDisplay = document.getElementById('status');
const resetButton = document.getElementById('reset');
const playerVsPlayerButton = document.getElementById('playerVsPlayer');
const playerVsAIBtn = document.getElementById('playerVsAI');
const difficultySelector = document.getElementById('difficulty-selector');
const difficultySelect = document.getElementById('difficulty');
const themeToggle = document.getElementById('checkbox');
const winLine = document.getElementById('win-line');

let gameActive = true;
let currentPlayer = 'X';
let gameState = ["", "", "", "", "", "", "", "", ""];
let isAIGame = false;
let aiDifficulty = 'medium';
let scores = {
    X: 0,
    O: 0
};
let lastWinningCombination = null;
let updateActivePlayerUI;
let playerSymbol = 'X';
let aiSymbol = 'O';

const winningConditions = [
    [0, 1, 2], // horizontal top
    [3, 4, 5], // horizontal middle
    [6, 7, 8], // horizontal bottom
    [0, 3, 6], // vertical left
    [1, 4, 7], // vertical middle
    [2, 5, 8], // vertical right
    [0, 4, 8], // diagonal top-left to bottom-right
    [2, 4, 6]  // diagonal top-right to bottom-left
];

const WINNING_COMBINATIONS = winningConditions;

function handleThemeSwitch() {
    document.body.classList.toggle('dark-theme');
    const slider = document.querySelector('.slider');
    const icon = slider.querySelector('i');
    
    if (document.body.classList.contains('dark-theme')) {
        icon.className = '';
        setTimeout(() => {
            icon.className = 'fas fa-moon';
        }, 200);
    } else {
        icon.className = '';
        setTimeout(() => {
            icon.className = 'fas fa-sun';
        }, 200);
    }
    
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
}

function createBoard() {
    gameState.fill("");
    board.innerHTML = "";
    
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.setAttribute('data-cell-index', i);
        cell.addEventListener('click', handleCellClick);
        board.appendChild(cell);
    }
    
    board.style.opacity = '1';
    board.style.transform = 'none';
}

function handleCellClick(event) {
    if (!gameActive) return;
    
    const clickedCell = event.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-cell-index'));

    if (gameState[clickedCellIndex] !== "" || !gameActive) return;

    const ripple = document.createElement('div');
    ripple.classList.add('ripple');
    clickedCell.appendChild(ripple);
    
    const rect = clickedCell.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2.5;
    
    ripple.style.setProperty('--ripple-size', `${size}px`);
    ripple.style.setProperty('--ripple-x', `${event.clientX - rect.left - size/2}px`);
    ripple.style.setProperty('--ripple-y', `${event.clientY - rect.top - size/2}px`);
    
    ripple.addEventListener('animationend', () => {
        ripple.remove();
    });

    handleCellPlayed(clickedCell, clickedCellIndex);
    handleResultValidation();
    
    if (gameActive && isAIGame && currentPlayer === aiSymbol) {
        board.style.pointerEvents = 'none';
        
        setTimeout(() => {
            makeAIMove();
            board.style.pointerEvents = 'auto';
        }, 500);
    }
}

function handleCellPlayed(clickedCell, clickedCellIndex) {
    gameState[clickedCellIndex] = currentPlayer;
    clickedCell.innerHTML = currentPlayer;
    clickedCell.classList.add(currentPlayer.toLowerCase());
}

function handleResultValidation() {
    let roundWon = false;
    let winningLine = null;
    
    for (let i = 0; i < WINNING_COMBINATIONS.length; i++) {
        const condition = WINNING_COMBINATIONS[i];
        const a = gameState[condition[0]];
        const b = gameState[condition[1]];
        const c = gameState[condition[2]];
        if (a === "" || b === "" || c === "") {
            continue;
        }
        if (a === b && b === c) {
            roundWon = true;
            winningLine = condition;
            break;
        }
    }

    if (roundWon) {
        statusDisplay.innerHTML = `
            <span style="animation: fadeIn 0.5s forwards;">
                <i class="fas fa-trophy" style="color: gold; margin-right: 8px;"></i>
                Player ${currentPlayer} Wins!
            </span>
        `;
        gameActive = false;
        
        setTimeout(() => highlightWinningCells(winningLine), 200);
        
        scores[currentPlayer]++;
        const scoreElement = document.getElementById(`score-${currentPlayer.toLowerCase()}`);
        scoreElement.textContent = scores[currentPlayer];
        scoreElement.style.animation = 'scoreIncrement 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
        setTimeout(() => {
            scoreElement.style.animation = '';
        }, 800);
        
        setTimeout(() => {
            drawWinLine(winningLine);
        }, 400);
        
        lastWinningCombination = winningLine;
        
        return true;
    }

    if (!gameState.includes("")) {
        statusDisplay.innerHTML = `
            <span style="animation: fadeIn 0.5s forwards;">
                <i class="fas fa-handshake"></i> It's a Draw!
            </span>
        `;
        gameActive = false;
        return false;
    }

    handlePlayerChange();
    return false;
}

function highlightWinningCells(winningCombination) {
    winningCombination.forEach((index, i) => {
        setTimeout(() => {
            document.querySelector(`[data-cell-index="${index}"]`).classList.add('winner');
        }, i * 150);
    });
}

function drawWinLine(combination) {
    const board = document.getElementById('board');
    const line = document.createElement('div');
    line.classList.add('win-line');
    
    const firstCell = document.querySelector(`[data-cell-index="${combination[0]}"]`).getBoundingClientRect();
    const lastCell = document.querySelector(`[data-cell-index="${combination[2]}"]`).getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();

    let angle = 0;
    let width, top, left;
    
    if (combination[0] % 3 === 0 && combination[2] % 3 === 2) {
        width = lastCell.right - firstCell.left;
        top = (firstCell.top + firstCell.bottom) / 2 - boardRect.top;
        left = firstCell.left - boardRect.left;
    } 

    else if (combination[0] < 3 && combination[2] > 5) {
        width = lastCell.bottom - firstCell.top;
        top = firstCell.top - boardRect.top;
        left = (firstCell.left + firstCell.right) / 2 - boardRect.left;
        angle = 90;
    } 

    else if (combination[0] === 0 && combination[2] === 8) {
        width = Math.sqrt(
            Math.pow(lastCell.left - firstCell.left, 2) + 
            Math.pow(lastCell.top - firstCell.top, 2)
        ) * 1.2;
        top = firstCell.top - boardRect.top;
        left = firstCell.left - boardRect.left;
        angle = 45;
    } 

    else if (combination[0] === 2 && combination[2] === 6) {
        width = Math.sqrt(
            Math.pow(lastCell.left - firstCell.left, 2) + 
            Math.pow(lastCell.top - firstCell.top, 2)
        ) * 1.2;
        top = firstCell.top - boardRect.top;
        left = firstCell.right - boardRect.left;
        angle = -45;
    }
    
    line.style.width = `${width}px`;
    line.style.height = '6px';
    line.style.top = `${top}px`;
    line.style.left = `${left}px`;
    line.style.transformOrigin = 'left center';
    line.style.transform = `rotate(${angle}deg)`;
    
    board.appendChild(line);
}

function hideWinLine() {
    const existingLines = document.querySelectorAll('.win-line');
    existingLines.forEach(line => line.remove());
}

function initializeGame() {
    createBoard();
    statusDisplay.innerHTML = `Player ${currentPlayer}'s turn`;
    updateScoreboard();
    updateActivePlayerUI();
    
    if (isAIGame) {
        playerVsAIBtn.classList.add('active');
        playerVsPlayerButton.classList.remove('active');
        difficultySelector.style.display = 'flex';
        document.getElementById('symbol-selector').style.display = 'flex';
    } else {
        playerVsPlayerButton.classList.add('active');
        playerVsAIBtn.classList.remove('active');
        difficultySelector.style.display = 'none';
        document.getElementById('symbol-selector').style.display = 'none';
    }
}

function resetGame() {
    const board = document.getElementById('board');
    board.style.animation = '';
    board.style.opacity = '1';
    board.style.transform = 'none';
    board.classList.add('visible');
    
    document.querySelectorAll('.scoreboard, .game-status, .buttons, .difficulty-selector, .symbol-selector, .footer').forEach(el => {
        el.classList.add('visible');
    });

    startNewGame();
}

function resetScores() {
    scores = { X: 0, O: 0 };
    updateScoreboard();
}

function updateScoreboard() {
    document.getElementById('score-x').textContent = scores.X;
    document.getElementById('score-o').textContent = scores.O;
}

playerVsPlayerButton.addEventListener('click', () => {

    if (!isAIGame) {
        resetGame();
        return;
    }
    
    isAIGame = false;
    resetGame();
});

playerVsAIBtn.addEventListener('click', () => {

    if (isAIGame) {
        resetGame();
        return;
    }
    
    isAIGame = true;
    resetGame();
});

function applyDifficulty(difficulty) {
    aiDifficulty = difficulty;
    console.log("AI difficulty set to:", aiDifficulty);

    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        if (btn.getAttribute('data-difficulty') === difficulty) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    localStorage.setItem('difficulty', aiDifficulty);
    
    if (isAIGame && gameActive && currentPlayer === aiSymbol) {
        setTimeout(() => {
            makeAIMove();
        }, 500);
    }
}

resetButton.addEventListener('click', resetGame);
resetButton.addEventListener('dblclick', resetScores);

function makeAIMove() {
    if (!gameActive) return;
    
    let move;
    
    switch(aiDifficulty) {
        case 'easy':
            move = getRandomMove();
            break;
        case 'medium':
            move = Math.random() < 0.7 ? getBestMove() : getRandomMove();
            break;
        case 'hard':
        case 'impossible':
            move = getBestMove();
            break;
        default:
            move = getRandomMove();
    }
    
    const cell = document.querySelector(`[data-cell-index="${move}"]`);
    if (cell) {
        cell.click();
    }
}

function getRandomMove() {
    const availableMoves = gameState
        .map((cell, index) => cell === "" ? index : null)
        .filter(index => index !== null);
        
    if (availableMoves.length === 0) return -1;
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

function getBestMove() {
    let bestScore = -Infinity;
    let bestMove = -1;
    
    for (let i = 0; i < 9; i++) {
        if (gameState[i] === "") {
            gameState[i] = aiSymbol;
            let score = minimax(gameState, 0, false);
            gameState[i] = "";
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    
    return bestMove;
}

function minimax(board, depth, isMaximizing) {
    const result = checkWinner();
    
    if (result !== null) {
        return result;
    }
    
    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === "") {
                board[i] = aiSymbol;
                let score = minimax(board, depth + 1, false);
                board[i] = "";
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === "") {
                board[i] = playerSymbol;
                let score = minimax(board, depth + 1, true);
                board[i] = "";
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function checkWinner() {
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
            return gameState[a] === aiSymbol ? 10 : -10;
        }
    }
    if (!gameState.includes("")) {
        return 0;
    }
    
    return null;
}

function addRippleStyle() {
    const style = document.createElement('style');
    style.textContent = `
        .ripple {
            position: absolute;
            top: var(--ripple-y, 0);
            left: var(--ripple-x, 0);
            width: var(--ripple-size, 0);
            height: var(--ripple-size, 0);
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.4);
            transform: scale(0);
            animation: ripple 0.5s ease-out forwards;
            pointer-events: none;
            will-change: transform, opacity;
        }
    `;
    document.head.appendChild(style);
}

function addResizeHandler() {
    let resizeTimer;
    
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const winLines = document.querySelectorAll('.win-line');
            if (winLines.length > 0) {
                winLines.forEach(line => line.remove());
                
                if (lastWinningCombination) {
                    drawWinLine(lastWinningCombination);
                }
            }
        }, 250);
    });
}

function addDynamicEffects() {
    const playerIcons = document.querySelectorAll('.player-icon');
    playerIcons.forEach(icon => {
        const randomDelay = Math.random() * 2;
        icon.style.animation = `floatEffect 3s ease-in-out ${randomDelay}s infinite alternate`;
    });
    
    updateActivePlayerUI = function() {
        try {
            const activePlayerClass = currentPlayer.toLowerCase();
            const inactivePlayerClass = currentPlayer === 'X' ? 'o' : 'x';
            
            const activeScoreElement = document.getElementById(`score-${activePlayerClass}`);
            const inactiveScoreElement = document.getElementById(`score-${inactivePlayerClass}`);
            
            if (!activeScoreElement || !inactiveScoreElement) return;
            
            const activeScoreParent = activeScoreElement.closest('.score-item');
            const inactiveScoreParent = inactiveScoreElement.closest('.score-item');
            
            if (activeScoreParent && inactiveScoreParent) {
                activeScoreParent.classList.add('active-player');
                inactiveScoreParent.classList.remove('active-player');
                
                if (currentPlayer === 'X') {
                    activeScoreParent.classList.add('x-turn');
                    activeScoreParent.classList.remove('o-turn');
                } else {
                    activeScoreParent.classList.add('o-turn');
                    activeScoreParent.classList.remove('x-turn');
                }
            }
        } catch (error) {
            console.error("Error updating active player UI:", error);
        }
    };
    
    const originalHandleResultValidation = handleResultValidation;
    handleResultValidation = function() {
        const result = originalHandleResultValidation.apply(this, arguments);
        if (gameActive) {
            updateActivePlayerUI();
        }
        return result;
    };
    
    updateActivePlayerUI();
}

function handlePlayerChange() {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    statusDisplay.innerHTML = `Player ${currentPlayer}'s turn`;
    updateActivePlayerUI();
}

const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    @keyframes floatEffect {
        0% { transform: translateY(0); }
        100% { transform: translateY(-5px); }
    }
    
    .active-player {
        position: relative;
    }
    
    .active-player::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 0;
        width: 100%;
        height: 3px;
        background: linear-gradient(90deg, transparent, var(--accent-color), transparent);
        animation: pulseWidth 1.5s ease-in-out infinite;
    }
    
    .dark-theme .active-player::after {
        background: linear-gradient(90deg, transparent, var(--neon-blue), transparent);
        box-shadow: 0 0 5px var(--neon-blue);
    }
    
    @keyframes pulseWidth {
        0%, 100% { transform: scaleX(0.7); opacity: 0.5; }
        50% { transform: scaleX(1); opacity: 1; }
    }
`;
document.head.appendChild(additionalStyles);

function handleGameError(error) {
    console.error("Game error:", error);
    
    gameActive = true;
    currentPlayer = 'X';
    gameState = ["", "", "", "", "", "", "", "", ""];
    
    const board = document.getElementById('board');
    board.style.animation = '';
    board.style.opacity = '1';
    board.style.transform = 'none';
    board.classList.add('visible');
    board.innerHTML = '';
    
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.setAttribute('data-cell-index', i);
        cell.addEventListener('click', handleCellClick);
        board.appendChild(cell);
    }
    
    statusDisplay.innerHTML = `Game reset due to an error`;
}

function fixCssVariables() {
    document.documentElement.style.setProperty('--accent-color', '#4299e1');
}

function handleSymbolSelection(symbol) {
    playerSymbol = symbol;
    aiSymbol = symbol === 'X' ? 'O' : 'X';
    document.querySelectorAll('.symbol-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.symbol-btn[data-symbol="${symbol}"]`).classList.add('active');
    resetGame();
}

function showGameStartModal() {
    const modal = document.getElementById('game-start-modal');
    modal.style.display = 'flex';
    isAIGame = true;

    const savedDifficulty = localStorage.getItem('difficulty');
    if (savedDifficulty) {
        aiDifficulty = savedDifficulty;
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            if (btn.getAttribute('data-difficulty') === savedDifficulty) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    document.getElementById('start-vs-ai').addEventListener('click', () => {
        isAIGame = true;
        document.getElementById('start-vs-ai').classList.add('active');
        document.getElementById('start-vs-player').classList.remove('active');
        document.getElementById('modal-difficulty-selector').style.display = 'block';
        document.getElementById('modal-symbol-selector').style.display = 'block';
    });
    
    document.getElementById('start-vs-player').addEventListener('click', () => {
        isAIGame = false;
        document.getElementById('start-vs-player').classList.add('active');
        document.getElementById('start-vs-ai').classList.remove('active');
        document.getElementById('modal-difficulty-selector').style.display = 'none';
        document.getElementById('modal-symbol-selector').style.display = 'none';
    });
    
    document.querySelectorAll('#modal-symbol-selector .symbol-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#modal-symbol-selector .symbol-btn').forEach(b => {
                b.classList.remove('active');
            });
            e.target.classList.add('active');
            playerSymbol = e.target.getAttribute('data-symbol');
            aiSymbol = playerSymbol === 'X' ? 'O' : 'X';
        });
    });
    
    document.querySelectorAll('#modal-difficulty-selector .difficulty-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const difficulty = e.target.getAttribute('data-difficulty');
            applyDifficulty(difficulty);
        });
    });
    
    document.getElementById('start-game-btn').addEventListener('click', () => {
        modal.style.display = 'none';
        startNewGame();
    });
}

function setupDifficultyButtons() {
    document.querySelectorAll('#difficulty-selector .difficulty-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', function() {
            const difficulty = this.getAttribute('data-difficulty');
            applyDifficulty(difficulty);
        });
    });
}

const difficultySelectElement = document.getElementById("difficultySelect");
const selectedDifficulty = difficultySelectElement.value;

difficultySelectElement.addEventListener("change", function() {
    const newDifficulty = this.value;
    console.log("Difficulty changed to:", newDifficulty);
});

function startNewGame() {
    gameActive = true;
    currentPlayer = playerSymbol;
    gameState = ["", "", "", "", "", "", "", "", ""];

    if (isAIGame) {
        playerVsAIBtn.classList.add('active');
        playerVsPlayerButton.classList.remove('active');
        difficultySelector.style.display = 'flex';
        document.getElementById('symbol-selector').style.display = 'flex';
        
        document.querySelectorAll('.difficulty-btn:not(.modal-content .difficulty-btn)').forEach(btn => {
            if (btn.getAttribute('data-difficulty') === aiDifficulty) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        document.querySelectorAll('.symbol-btn:not(.modal-content .symbol-btn)').forEach(btn => {
            if (btn.getAttribute('data-symbol') === playerSymbol) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    } else {
        playerVsPlayerButton.classList.add('active');
        playerVsAIBtn.classList.remove('active');
        difficultySelector.style.display = 'none';
        document.getElementById('symbol-selector').style.display = 'none';
    }
    
    const existingLines = document.querySelectorAll('.win-line');
    existingLines.forEach(line => line.remove());
    lastWinningCombination = null;
    createBoard();
    
    statusDisplay.innerHTML = `Player ${currentPlayer}'s turn`;
    updateScoreboard();
    updateActivePlayerUI();
    
    setupDifficultyButtons();
    
    if (isAIGame && currentPlayer === aiSymbol) {
        setTimeout(() => {
            makeAIMove();
        }, 700);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    try {
        fixCssVariables();
        addRippleStyle();
        
        const themeSwitch = document.querySelector('.theme-switch');
        themeSwitch.addEventListener('click', handleThemeSwitch);
        
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-theme');
            document.querySelector('.slider i').className = 'fas fa-moon';
        }
        
        updateActivePlayerUI = function() {
            try {
                const activePlayerClass = currentPlayer.toLowerCase();
                const inactivePlayerClass = currentPlayer === 'X' ? 'o' : 'x';
                
                const activeScoreElement = document.getElementById(`score-${activePlayerClass}`);
                const inactiveScoreElement = document.getElementById(`score-${inactivePlayerClass}`);
                
                if (!activeScoreElement || !inactiveScoreElement) return;
                
                const activeScoreParent = activeScoreElement.closest('.score-item');
                const inactiveScoreParent = inactiveScoreElement.closest('.score-item');
                
                if (activeScoreParent && inactiveScoreParent) {
                    activeScoreParent.classList.add('active-player');
                    inactiveScoreParent.classList.remove('active-player');
                    
                    if (currentPlayer === 'X') {
                        activeScoreParent.classList.add('x-turn');
                        activeScoreParent.classList.remove('o-turn');
                    } else {
                        activeScoreParent.classList.add('o-turn');
                        activeScoreParent.classList.remove('x-turn');
                    }
                }
            } catch (error) {
                console.error("Error updating active player UI:", error);
            }
        };
        
        setupDifficultyButtons();
        
        document.querySelectorAll('.symbol-btn:not(.modal-content .symbol-btn)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const selectedSymbol = e.target.getAttribute('data-symbol');
                handleSymbolSelection(selectedSymbol);
            });
        });
        
        playerVsPlayerButton.addEventListener('click', () => {
            if (!isAIGame) {
                resetGame();
                return;
            }
            
            isAIGame = false;
            resetGame();
        });
        
        playerVsAIBtn.addEventListener('click', () => {
            if (isAIGame) {
                resetGame();
                return;
            }
            
            isAIGame = true;
            resetGame();
        });
        
        resetButton.addEventListener('click', resetGame);
        resetButton.addEventListener('dblclick', resetScores);
        
        addResizeHandler();
        
        showGameStartModal();
        
    } catch (error) {
        handleGameError(error);
    }
});
