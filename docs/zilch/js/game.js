const WINNING_SCORE = 10000;
const STORAGE_KEY = 'zilch_stats';

const DICE_FACES = [
    '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'
];

let gameState = {
    dice: [],
    frozenDice: [],
    frozenScore: 0,
    turnScore: 0,
    totalScore: 0,
    turnsPlayed: 0,
    zilches: 0,
    phase: 'start',
    selectedForScoring: [],
    hasRolled: false,
    stats: {
        highScore: 0
    }
};

function init() {
    loadStats();
    setupEventListeners();
    updateUI();
}

function loadStats() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        gameState.stats = JSON.parse(saved);
    }
}

function saveStats() {
    if (gameState.totalScore > gameState.stats.highScore) {
        gameState.stats.highScore = gameState.totalScore;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState.stats));
}

function setupEventListeners() {
    document.getElementById('roll-btn').addEventListener('click', rollDice);
    document.getElementById('bank-btn').addEventListener('click', bankPoints);
    document.getElementById('new-game-btn').addEventListener('click', newGame);
    
    document.getElementById('rules-btn').addEventListener('click', () => {
        document.getElementById('rules-modal').classList.remove('hidden');
    });
    document.getElementById('close-rules').addEventListener('click', () => {
        document.getElementById('rules-modal').classList.add('hidden');
    });
    document.getElementById('rules-modal').addEventListener('click', (e) => {
        if (e.target.id === 'rules-modal') {
            document.getElementById('rules-modal').classList.add('hidden');
        }
    });
}

function rollDice() {
    if (gameState.phase === 'gameover') return;
    
    const diceToRoll = 6 - gameState.frozenDice.length;
    
    if (diceToRoll === 0) {
        gameState.frozenDice = [];
        gameState.frozenScore = 0;
        showMessage('All dice scored! Roll again!', 'scoring');
    }
    
    gameState.dice = [];
    for (let i = 0; i < (diceToRoll === 0 ? 6 : diceToRoll); i++) {
        gameState.dice.push(Math.floor(Math.random() * 6) + 1);
    }
    
    gameState.hasRolled = true;
    gameState.selectedForScoring = [];
    
    renderDice();
    calculateAndShowScore();
}

function calculateAndShowScore() {
    const scoringCombos = findScoringCombinations([...gameState.dice]);
    const canScore = scoringCombos.length > 0;
    
    if (!canScore && gameState.dice.length > 0) {
        zilch();
        return;
    }
    
    enableDiceSelection(scoringCombos);
    updateUI();
}

function findScoringCombinations(dice) {
    const scoring = [];
    const counts = {};
    
    dice.forEach(d => {
        counts[d] = (counts[d] || 0) + 1;
    });
    
    const sorted = [...dice].sort((a, b) => a - b);
    const isStraight = sorted.length === 6 && 
        sorted[0] === 1 && sorted[1] === 2 && sorted[2] === 3 &&
        sorted[3] === 4 && sorted[4] === 5 && sorted[5] === 6;
    
    if (isStraight) {
        scoring.push({
            type: 'straight',
            indices: [0, 1, 2, 3, 4, 5],
            score: 1000,
            description: 'Straight!'
        });
    }
    
    Object.entries(counts).forEach(([num, count]) => {
        const n = parseInt(num);
        
        if (count >= 3) {
            if (n === 1) {
                const score = count === 4 ? 2000 : count === 5 ? 4000 : count === 6 ? 8000 : 1000;
                scoring.push({
                    type: 'triple',
                    value: n,
                    count: count,
                    score: score,
                    description: `${count}x 1s = ${score}`
                });
            } else {
                const baseScore = n * 100;
                let multiplier = 1;
                if (count === 4) multiplier = 2;
                else if (count === 5) multiplier = 4;
                else if (count === 6) multiplier = 8;
                
                scoring.push({
                    type: 'triple',
                    value: n,
                    count: count,
                    score: baseScore * multiplier,
                    description: `${count}x ${n}s = ${baseScore * multiplier}`
                });
            }
        }
    });
    
    const pairs = [];
    Object.entries(counts).forEach(([num, count]) => {
        for (let i = 0; i < Math.floor(count / 2); i++) {
            pairs.push(parseInt(num));
        }
    });
    
    if (pairs.length >= 3) {
        scoring.push({
            type: 'pairs',
            score: 1000,
            description: 'Three Pairs = 1000'
        });
    }
    
    dice.forEach((d, i) => {
        if (d === 1) {
            scoring.push({
                type: 'single',
                indices: [i],
                score: 100,
                description: '1 = 100'
            });
        }
        if (d === 5) {
            scoring.push({
                type: 'single',
                indices: [i],
                score: 50,
                description: '5 = 50'
            });
        }
    });
    
    return scoring;
}

function enableDiceSelection(scoringCombos) {
    const selectableIndices = new Set();
    
    scoringCombos.forEach(combo => {
        if (combo.indices) {
            combo.indices.forEach(i => selectableIndices.add(i));
        } else if (combo.type === 'triple') {
            let found = 0;
            gameState.dice.forEach((d, i) => {
                if (d === combo.value && found < combo.count && !selectableIndices.has(i)) {
                    selectableIndices.add(i);
                    found++;
                }
            });
        }
    });
    
    scoringCombos.forEach(combo => {
        if (combo.type === 'single') {
            selectableIndices.add(combo.indices[0]);
        }
    });
    
    gameState.selectableIndices = Array.from(selectableIndices);
    showMessage('Select scoring dice, then Roll or Bank', '');
}

function renderDice() {
    const tray = document.getElementById('dice-tray');
    
    const allDice = [...gameState.frozenDice, ...gameState.dice];
    
    tray.innerHTML = allDice.map((value, index) => {
        const isFrozen = index < gameState.frozenDice.length;
        const diceIndex = isFrozen ? index : index - gameState.frozenDice.length;
        const isSelectable = !isFrozen && gameState.selectableIndices && gameState.selectableIndices.includes(diceIndex);
        const isSelected = gameState.selectedForScoring.includes(diceIndex);
        const isRed = value === 1 || value === 3 || value === 5;
        
        let classes = 'die';
        if (isRed) classes += ' red';
        else classes += ' black';
        if (isFrozen) classes += ' frozen';
        if (!isFrozen && !isSelectable) classes += ' non-scoring';
        if (isSelected) classes += ' selected';
        
        return `<div class="${classes}" data-index="${isFrozen ? -1 : diceIndex}" data-value="${value}">${DICE_FACES[value - 1]}</div>`;
    }).join('');
    
    document.querySelectorAll('.die:not(.frozen):not(.non-scoring)').forEach(die => {
        die.addEventListener('click', () => toggleDiceSelection(parseInt(die.dataset.index)));
    });
}

function toggleDiceSelection(index) {
    const idx = gameState.selectedForScoring.indexOf(index);
    
    if (idx > -1) {
        gameState.selectedForScoring.splice(idx, 1);
    } else {
        gameState.selectedForScoring.push(index);
    }
    
    const totalSelectedScore = calculateSelectedScore();
    document.getElementById('bank-amount').textContent = gameState.frozenScore + totalSelectedScore + gameState.turnScore;
    document.getElementById('bank-btn').disabled = (gameState.frozenScore + totalSelectedScore) === 0;
    
    renderDice();
}

function calculateSelectedScore() {
    const selectedDice = gameState.selectedForScoring.map(i => gameState.dice[i]);
    return calculateDiceScore(selectedDice);
}

function calculateDiceScore(dice) {
    if (dice.length === 0) return 0;
    
    const counts = {};
    dice.forEach(d => counts[d] = (counts[d] || 0) + 1);
    
    const sorted = [...dice].sort((a, b) => a - b);
    const isStraight = sorted.length === 6 && 
        sorted[0] === 1 && sorted[1] === 2 && sorted[2] === 3 &&
        sorted[3] === 4 && sorted[4] === 5 && sorted[5] === 6;
    
    if (isStraight) return 1000;
    
    let score = 0;
    
    Object.entries(counts).forEach(([num, count]) => {
        const n = parseInt(num);
        
        if (count >= 3) {
            if (n === 1) {
                score += count === 4 ? 2000 : count === 5 ? 4000 : count === 6 ? 8000 : 1000;
            } else {
                const base = n * 100;
                let mult = count === 4 ? 2 : count === 5 ? 4 : count === 6 ? 8 : 1;
                score += base * mult;
            }
        }
    });
    
    const pairs = Object.values(counts).filter(c => c >= 2).reduce((sum, c) => sum + Math.floor(c / 2), 0);
    if (pairs >= 3) score += 1000;
    
    if (counts[1]) score += counts[1] * 100;
    if (counts[5]) score += counts[5] * 50;
    
    return score;
}

function bankPoints() {
    const selectedScore = calculateSelectedScore();
    const totalTurnScore = gameState.turnScore + gameState.frozenScore + selectedScore;
    
    gameState.turnScore = totalTurnScore;
    gameState.totalScore += totalTurnScore;
    gameState.turnsPlayed++;
    
    if (gameState.totalScore >= WINNING_SCORE) {
        gameWon();
        return;
    }
    
    resetTurn();
    updateUI();
    showMessage(`Banked ${totalTurnScore} points! Total: ${gameState.totalScore}`, 'scoring');
}

function zilch() {
    gameState.zilches++;
    gameState.turnScore = 0;
    
    showMessage('ZILCH! You lose all turn points!', 'zilch');
    
    setTimeout(() => {
        resetTurn();
        updateUI();
    }, 1500);
}

function gameWon() {
    gameState.phase = 'gameover';
    saveStats();
    
    const overlay = document.createElement('div');
    overlay.className = 'winner-overlay';
    overlay.innerHTML = `
        <div class="winner-content">
            <h2>🎉 YOU WIN! 🎉</h2>
            <p>Final Score: ${gameState.totalScore}</p>
            <button class="btn btn-primary btn-lg" onclick="newGame()">Play Again</button>
        </div>
    `;
    document.body.appendChild(overlay);
    
    updateUI();
}

function resetTurn() {
    gameState.dice = [];
    gameState.frozenDice = [];
    gameState.frozenScore = 0;
    gameState.turnScore = 0;
    gameState.hasRolled = false;
    gameState.selectedForScoring = [];
    gameState.phase = 'start';
    gameState.selectableIndices = [];
    
    document.getElementById('dice-tray').innerHTML = '<div class="dice-placeholder">Click Roll to continue!</div>';
    document.getElementById('frozen-list').innerHTML = '';
}

function newGame() {
    const overlay = document.querySelector('.winner-overlay');
    if (overlay) overlay.remove();
    
    gameState.totalScore = 0;
    gameState.turnScore = 0;
    gameState.turnsPlayed = 0;
    gameState.zilches = 0;
    
    resetTurn();
    updateUI();
    showMessage('Roll the dice to begin!', '');
}

function updateUI() {
    document.getElementById('total-score').textContent = gameState.totalScore;
    document.getElementById('turn-score').textContent = gameState.turnScore;
    document.getElementById('dice-left').textContent = 6 - gameState.frozenDice.length;
    document.getElementById('turns-played').textContent = gameState.turnsPlayed;
    document.getElementById('zilches').textContent = gameState.zilches;
    document.getElementById('high-score').textContent = gameState.stats.highScore;
    document.getElementById('frozen-score').textContent = `${gameState.frozenScore + calculateSelectedScore()} pts`;
    
    const bankAmount = gameState.frozenScore + calculateSelectedScore() + gameState.turnScore;
    document.getElementById('bank-amount').textContent = bankAmount;
    document.getElementById('bank-btn').disabled = bankAmount === 0 || !gameState.hasRolled;
    
    if (gameState.phase === 'gameover') {
        document.getElementById('roll-btn').classList.add('hidden');
        document.getElementById('bank-btn').classList.add('hidden');
        document.getElementById('new-game-btn').classList.remove('hidden');
    } else {
        document.getElementById('roll-btn').classList.remove('hidden');
        document.getElementById('bank-btn').classList.remove('hidden');
        document.getElementById('new-game-btn').classList.add('hidden');
    }
}

function showMessage(text, type) {
    const msgEl = document.getElementById('message');
    msgEl.textContent = text;
    msgEl.className = type;
}

document.addEventListener('DOMContentLoaded', init);
