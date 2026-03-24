const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const VALUES = {
    'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
    '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
};
const RANK_NAMES = {
    'A': 'Ace', '2': 'Two', '3': 'Three', '4': 'Four', '5': 'Five',
    '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine', '10': 'Ten',
    'J': 'Jack', 'Q': 'Queen', 'K': 'King'
};

const STORAGE_KEY = 'cleardeck_scores';

let gameState = {
    mode: null,
    numAI: 0,
    round: 1,
    players: [],
    currentPlayer: 0,
    pile: [],
    pileValue: 0,
    scores: {},
    selectedCards: [],
    isPlayerTurn: true,
    gameStarted: false
};

function init() {
    setupEventListeners();
    loadScores();
}

function loadScores() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        gameState.scores = JSON.parse(saved);
    }
}

function saveScores() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState.scores));
}

function setupEventListeners() {
    document.getElementById('solo-btn').addEventListener('click', () => startGame('solo'));
    document.getElementById('vs-ai-btn').addEventListener('click', () => {
        document.getElementById('ai-select').classList.remove('hidden');
    });
    
    document.querySelectorAll('.ai-buttons .btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const numAI = parseInt(btn.dataset.ai);
            startGame('vsAI', numAI);
        });
    });

    document.getElementById('play-btn').addEventListener('click', playSelectedCards);
    document.getElementById('clear-btn').addEventListener('click', clearDeck);
    document.getElementById('take-pile-btn').addEventListener('click', takePile);
    document.getElementById('end-game-btn').addEventListener('click', endGame);
    document.getElementById('next-round-btn').addEventListener('click', nextRound);
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

function startGame(mode, numAI = 0) {
    gameState.mode = mode;
    gameState.numAI = numAI;
    gameState.round = 1;
    gameState.gameStarted = true;
    
    const totalPlayers = mode === 'solo' ? 1 : 1 + numAI;
    gameState.players = [];
    
    for (let i = 0; i < totalPlayers; i++) {
        const player = {
            id: i,
            name: i === 0 ? 'You' : `AI ${i}`,
            isAI: i !== 0,
            faceDown: [],
            faceUp: [],
            hand: [],
            totalCards: 0
        };
        gameState.players.push(player);
        
        if (!gameState.scores[player.name]) {
            gameState.scores[player.name] = 0;
        }
    }
    
    document.getElementById('mode-select').classList.add('hidden');
    document.getElementById('game-area').classList.remove('hidden');
    
    dealCards();
    startRound();
}

function createDeck() {
    const deck = [];
    const numDecks = gameState.mode === 'solo' ? 1 : gameState.numAI >= 3 ? 3 : 2;
    
    for (let d = 0; d < numDecks; d++) {
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                deck.push({ suit, rank, isWild: rank === '10' });
            }
        }
    }
    
    return shuffleDeck(deck);
}

function shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function dealCards() {
    const deck = createDeck();
    
    for (const player of gameState.players) {
        player.faceDown = [];
        player.faceUp = [];
        player.hand = [];
        
        for (let i = 0; i < 4; i++) {
            player.faceDown.push(deck.pop());
        }
        for (let i = 0; i < 4; i++) {
            player.faceUp.push(deck.pop());
        }
        for (let i = 0; i < 12; i++) {
            player.hand.push(deck.pop());
        }
        
        player.totalCards = 20;
    }
    
    gameState.pile = [deck.pop()];
    gameState.pileValue = VALUES[gameState.pile[0].rank];
    gameState.selectedCards = [];
}

function startRound() {
    gameState.currentPlayer = 0;
    gameState.isPlayerTurn = true;
    
    document.getElementById('round').textContent = gameState.round;
    updateUI();
    
    if (gameState.currentPlayer === 0) {
        enablePlayerControls();
    } else {
        disablePlayerControls();
        setTimeout(() => aiTurn(), 1000);
    }
}

function updateUI() {
    renderAIs();
    renderPile();
    renderPlayerCards();
    updateStats();
}

function renderAIs() {
    const container = document.getElementById('ai-players');
    
    if (gameState.mode === 'solo') {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = gameState.players
        .filter(p => p.isAI)
        .map(p => `
            <div class="ai-player">
                <h4>${p.name} <span style="color: var(--accent-red)">[${p.totalCards}]</span></h4>
                <div class="ai-cards-display">
                    <span>FD: ${p.faceDown.length}</span>
                    <span>FU: ${p.faceUp.length}</span>
                    <span>H: ${p.hand.length}</span>
                </div>
            </div>
        `).join('');
}

function renderPile() {
    const container = document.getElementById('pile-cards');
    const valueDisplay = document.getElementById('pile-value');
    
    container.innerHTML = gameState.pile.map(card => {
        const isRed = card.suit === '♥' || card.suit === '♦';
        const isWild = card.isWild;
        return `<div class="card ${isRed ? 'red' : 'black'} ${isWild ? 'wild' : ''}">
            <span class="rank">${card.rank}</span>
            <span class="suit">${card.suit}</span>
        </div>`;
    }).join('');
    
    valueDisplay.textContent = gameState.pileValue;
}

function renderPlayerCards() {
    const player = gameState.players[0];
    
    document.getElementById('face-down').innerHTML = player.faceDown.map((card, i) => 
        `<div class="card face-down" data-zone="faceDown" data-index="${i}"></div>`
    ).join('');
    
    document.getElementById('face-up').innerHTML = player.faceUp.map((card, i) => {
        const isRed = card.suit === '♥' || card.suit === '♦';
        const isWild = card.isWild;
        const isSelected = gameState.selectedCards.some(c => c.zone === 'faceUp' && c.index === i);
        const playable = isCardPlayable(card, 'faceUp', i);
        return `<div class="card ${isRed ? 'red' : 'black'} ${isWild ? 'wild' : ''} ${isSelected ? 'selected' : ''} ${!playable && !isWild ? 'disabled' : ''}" 
            data-zone="faceUp" data-index="${i}" data-rank="${card.rank}">${card.rank}<br>${card.suit}</div>`;
    }).join('');
    
    document.getElementById('hand').innerHTML = player.hand.map((card, i) => {
        const isRed = card.suit === '♥' || card.suit === '♦';
        const isWild = card.isWild;
        const isSelected = gameState.selectedCards.some(c => c.zone === 'hand' && c.index === i);
        const playable = isCardPlayable(card, 'hand', i);
        return `<div class="card ${isRed ? 'red' : 'black'} ${isWild ? 'wild' : ''} ${isSelected ? 'selected' : ''} ${!playable && !isWild ? 'disabled' : ''}" 
            data-zone="hand" data-index="${i}" data-rank="${card.rank}">${card.rank}<br>${card.suit}</div>`;
    }).join('');
    
    document.getElementById('fd-count').textContent = `(${player.faceDown.length})`;
    document.getElementById('fu-count').textContent = `(${player.faceUp.length})`;
    document.getElementById('hand-count').textContent = `(${player.hand.length})`;
    document.getElementById('cards-remaining').textContent = `(${player.totalCards})`;
    
    document.querySelectorAll('#face-up .card, #hand .card').forEach(cardEl => {
        cardEl.addEventListener('click', () => handleCardClick(cardEl));
    });
    
    updateButtonStates();
}

function isCardPlayable(card, zone, index) {
    const player = gameState.players[0];
    
    if (gameState.currentPlayer !== 0 || !gameState.isPlayerTurn) return false;
    
    if (zone === 'faceDown') {
        if (player.faceUp.length > 0) return false;
        return card.rank !== '10';
    }
    
    if (card.isWild) return true;
    
    return VALUES[card.rank] <= gameState.pileValue;
}

function updateButtonStates() {
    const player = gameState.players[0];
    const hasPlayable = player.hand.some((c, i) => isCardPlayable(c, 'hand', i)) ||
                       player.faceUp.some((c, i) => isCardPlayable(c, 'faceUp', i));
    
    const canClear = checkCanClear();
    
    document.getElementById('play-btn').disabled = gameState.selectedCards.length === 0;
    document.getElementById('clear-btn').disabled = !canClear;
    
    const mustTake = player.hand.some(c => c.rank !== '10' && VALUES[c.rank] > gameState.pileValue) &&
                    player.faceUp.every(c => c.isWild || VALUES[c.rank] > gameState.pileValue) &&
                    player.faceDown.length === 0;
    
    document.getElementById('take-pile-btn').classList.toggle('hidden', !mustTake);
}

function checkCanClear() {
    const player = gameState.players[0];
    const counts = {};
    
    const allCards = [...player.faceUp, ...player.hand];
    allCards.forEach(card => {
        if (!counts[card.rank]) counts[card.rank] = 0;
        counts[card.rank]++;
    });
    
    if (counts['10'] && counts['10'] >= 4) return true;
    
    return Object.values(counts).some(count => count >= 4);
}

function handleCardClick(cardEl) {
    if (cardEl.classList.contains('disabled')) return;
    
    const zone = cardEl.dataset.zone;
    const index = parseInt(cardEl.dataset.index);
    const rank = cardEl.dataset.rank;
    const player = gameState.players[0];
    
    if (rank === '10') {
        gameState.selectedCards = [{ zone, index, card: getCard(zone, index) }];
        renderPlayerCards();
        return;
    }
    
    const existingRank = gameState.selectedCards.length > 0 ? 
        gameState.selectedCards[0].card.rank : null;
    
    if (existingRank && existingRank !== rank) {
        gameState.selectedCards = [];
    }
    
    const isSelected = gameState.selectedCards.some(c => c.zone === zone && c.index === index);
    
    if (isSelected) {
        gameState.selectedCards = gameState.selectedCards.filter(c => !(c.zone === zone && c.index === index));
    } else {
        if (gameState.selectedCards.length === 0 || gameState.selectedCards[0].card.rank === rank) {
            gameState.selectedCards.push({ zone, index, card: getCard(zone, index) });
        }
    }
    
    renderPlayerCards();
}

function getCard(zone, index) {
    const player = gameState.players[0];
    if (zone === 'hand') return player.hand[index];
    if (zone === 'faceUp') return player.faceUp[index];
    return player.faceDown[index];
}

function removeCard(zone, index) {
    const player = gameState.players[0];
    if (zone === 'hand') player.hand.splice(index, 1);
    if (zone === 'faceUp') player.faceUp.splice(index, 1);
    if (zone === 'faceDown') player.faceDown.splice(index, 1);
    
    if (zone === 'faceDown' && player.faceUp.length > 0) {
        player.faceDown.unshift(player.faceUp.shift());
    }
    if (player.faceUp.length === 0 && player.faceDown.length > 0) {
        player.faceUp.unshift(player.faceDown.shift());
    }
    
    player.totalCards--;
}

function playSelectedCards() {
    if (gameState.selectedCards.length === 0) return;
    
    const player = gameState.players[0];
    const cards = [...gameState.selectedCards];
    const rank = cards[0].card.rank;
    
    if (rank === '10') {
        wildClear();
        return;
    }
    
    const cardValue = VALUES[rank];
    
    if (cardValue > gameState.pileValue) {
        showMessage('Higher value! You must take the pile.', 'must-take');
        takePile();
        gameState.selectedCards = [];
        renderPlayerCards();
        return;
    }
    
    const indices = cards.map(c => ({ zone: c.zone, index: c.index }));
    indices.sort((a, b) => b.index - a.index);
    indices.forEach(({ zone, index }) => removeCard(zone, index));
    
    const pileCards = indices.map(c => getCardFromIndices(c.zone, c.index));
    
    gameState.pile.push(...cards.map(c => c.card));
    gameState.pileValue = cardValue;
    gameState.selectedCards = [];
    
    const sameRankCount = [...player.faceUp, ...player.hand].filter(c => c.rank === rank).length;
    
    if (sameRankCount >= 4) {
        clearDeck();
    } else {
        checkWin();
        if (!gameState.gameStarted) return;
        
        showMessage('Your turn', 'your-turn');
        renderPlayerCards();
    }
}

function getCardFromIndices(zone, index) {
    const player = gameState.players[0];
    if (zone === 'hand') return player.hand[index];
    if (zone === 'faceUp') return player.faceUp[index];
    return null;
}

function wildClear() {
    const player = gameState.players[0];
    const wildCards = [];
    
    [...player.faceUp, ...player.hand].forEach((card, i) => {
        if (card.rank === '10') wildCards.push(card);
    });
    
    showMessage('WILD! Clear the Deck!', 'clear');
    
    gameState.pile.push(...wildCards);
    gameState.pileValue = 0;
    
    player.faceUp = player.faceUp.filter(c => c.rank !== '10');
    player.hand = player.hand.filter(c => c.rank !== '10');
    player.totalCards = player.faceDown.length + player.faceUp.length + player.hand.length;
    
    gameState.selectedCards = [];
    
    setTimeout(() => {
        checkWin();
        if (!gameState.gameStarted) return;
        endTurn();
    }, 1500);
}

function clearDeck() {
    const player = gameState.players[0];
    const counts = {};
    
    [...player.faceUp, ...player.hand].forEach(card => {
        if (!counts[card.rank]) counts[card.rank] = 0;
        counts[card.rank]++;
    });
    
    let clearRank = null;
    if (counts['10'] && counts['10'] >= 4) {
        clearRank = '10';
    } else {
        for (const [rank, count] of Object.entries(counts)) {
            if (count >= 4) {
                clearRank = rank;
                break;
            }
        }
    }
    
    if (!clearRank) return;
    
    showMessage(`Clear the Deck! (4+ ${RANK_NAMES[clearRank]}s)`, 'clear');
    
    const cardsToRemove = [];
    player.faceUp.forEach((c, i) => { if (c.rank === clearRank) cardsToRemove.push({ zone: 'faceUp', index: i }); });
    player.hand.forEach((c, i) => { if (c.rank === clearRank) cardsToRemove.push({ zone: 'hand', index: i }); });
    
    cardsToRemove.sort((a, b) => b.index - a.index);
    cardsToRemove.forEach(({ zone, index }) => removeCard(zone, index));
    
    gameState.pile.push(...cardsToRemove.map(c => c.card));
    gameState.pileValue = VALUES[clearRank];
    
    setTimeout(() => {
        checkWin();
        if (!gameState.gameStarted) return;
        renderPlayerCards();
    }, 1500);
}

function takePile() {
    const player = gameState.players[0];
    
    player.hand.push(...gameState.pile);
    player.totalCards += gameState.pile.length;
    
    gameState.pile = [];
    gameState.pileValue = 0;
    
    showMessage('You took the pile!', '');
    
    setTimeout(() => endTurn(), 1000);
}

function checkWin() {
    const player = gameState.players[0];
    
    if (player.totalCards === 0) {
        gameState.gameStarted = false;
        endRound();
        return true;
    }
    return false;
}

function endTurn() {
    gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
    
    if (gameState.currentPlayer === 0) {
        gameState.isPlayerTurn = true;
        showMessage('Your turn', 'your-turn');
        enablePlayerControls();
        renderPlayerCards();
    } else {
        gameState.isPlayerTurn = false;
        showMessage(`${gameState.players[gameState.currentPlayer].name}'s turn`, 'ai-turn');
        disablePlayerControls();
        setTimeout(() => aiTurn(), 1500);
    }
}

function enablePlayerControls() {
    document.getElementById('play-btn').disabled = false;
    document.getElementById('clear-btn').disabled = false;
}

function disablePlayerControls() {
    document.getElementById('play-btn').disabled = true;
    document.getElementById('clear-btn').disabled = true;
    document.getElementById('take-pile-btn').classList.add('hidden');
}

function aiTurn() {
    const ai = gameState.players[gameState.currentPlayer];
    
    if (ai.faceDown.length > 0 && ai.faceUp.length === 0) {
        ai.faceUp.unshift(ai.faceDown.shift());
    }
    
    const playable = getPlayableCards(ai);
    
    if (playable.length >= 4) {
        const counts = {};
        playable.forEach(card => {
            if (!counts[card.rank]) counts[card.rank] = 0;
            counts[card.rank]++;
        });
        
        const clearRank = counts['10'] && counts['10'] >= 4 ? '10' :
            Object.entries(counts).find(([, c]) => c >= 4)?.[0];
        
        if (clearRank) {
            const cardsToPlay = playable.filter(c => c.rank === clearRank);
            playAICards(ai, cardsToPlay);
            showMessage(`${ai.name} clears the deck!`, 'clear');
            setTimeout(() => {
                if (!checkAIWin(ai)) endTurn();
            }, 1500);
            return;
        }
    }
    
    if (playable.length > 0) {
        const cardValue = VALUES[playable[0].rank];
        
        if (cardValue > gameState.pileValue) {
            takePileAI(ai);
            showMessage(`${ai.name} takes the pile`, '');
            setTimeout(() => {
                ai.totalCards += gameState.pile.length;
                ai.hand.push(...gameState.pile);
                gameState.pile = [];
                gameState.pileValue = 0;
                endTurn();
            }, 1000);
        } else {
            const cardToPlay = playable[Math.floor(Math.random() * playable.length)];
            playAICards(ai, [cardToPlay]);
            
            setTimeout(() => {
                if (!checkAIWin(ai)) endTurn();
            }, 1000);
        }
    } else {
        takePileAI(ai);
        showMessage(`${ai.name} takes the pile`, '');
        setTimeout(() => {
            ai.totalCards += gameState.pile.length;
            ai.hand.push(...gameState.pile);
            gameState.pile = [];
            gameState.pileValue = 0;
            endTurn();
        }, 1000);
    }
    
    renderAIs();
}

function getPlayableCards(ai) {
    return [...ai.faceUp, ...ai.hand].filter(card => {
        if (card.rank === '10') return true;
        return VALUES[card.rank] <= gameState.pileValue;
    });
}

function playAICards(ai, cards) {
    cards.forEach(card => {
        let idx = ai.faceUp.findIndex(c => c.rank === card.rank && c.suit === card.suit);
        if (idx !== -1) {
            gameState.pile.push(ai.faceUp.splice(idx, 1)[0]);
        } else {
            idx = ai.hand.findIndex(c => c.rank === card.rank && c.suit === card.suit);
            if (idx !== -1) {
                gameState.pile.push(ai.hand.splice(idx, 1)[0]);
            }
        }
        ai.totalCards--;
    });
    
    if (ai.faceUp.length === 0 && ai.faceDown.length > 0) {
        ai.faceUp.unshift(ai.faceDown.shift());
    }
    
    gameState.pileValue = VALUES[cards[0].rank];
    renderPile();
}

function takePileAI(ai) {
    gameState.pile.forEach(card => ai.hand.push(card));
    ai.totalCards += gameState.pile.length;
    gameState.pile = [];
    gameState.pileValue = 0;
}

function checkAIWin(ai) {
    if (ai.totalCards === 0) {
        gameState.gameStarted = false;
        endRound();
        return true;
    }
    return false;
}

function showMessage(text, type) {
    const msgEl = document.getElementById('message');
    msgEl.textContent = text;
    msgEl.className = 'message ' + type;
}

function updateStats() {
    document.getElementById('player-score').textContent = gameState.scores['You'] || 0;
}

function endRound() {
    const player = gameState.players[0];
    let points = 0;
    
    [...player.faceDown, ...player.faceUp, ...player.hand].forEach(card => {
        if (card.rank === '10') points += 25;
        else if (['J', 'Q', 'K'].includes(card.rank)) points += VALUES[card.rank];
        else points += VALUES[card.rank];
    });
    
    gameState.scores['You'] = (gameState.scores['You'] || 0) + points;
    
    gameState.players.forEach((p, i) => {
        if (i === 0) return;
        
        if (p.totalCards === 0) {
            gameState.scores[p.name] = gameState.scores[p.name] || 0;
        } else {
            let aiPoints = 0;
            [...p.faceDown, p.faceUp, ...p.hand].forEach(card => {
                if (card.rank === '10') aiPoints += 25;
                else aiPoints += VALUES[card.rank];
            });
            gameState.scores[p.name] = (gameState.scores[p.name] || 0) + aiPoints;
        }
    });
    
    saveScores();
    showScoreModal();
}

function showScoreModal() {
    const roundScores = document.getElementById('round-scores');
    const totalScores = document.getElementById('total-scores');
    
    roundScores.innerHTML = '<h4>This Round</h4>' + gameState.players.map(p => 
        `<div class="score-row ${p.totalCards === 0 ? 'winner' : ''}">
            <span class="name">${p.name}</span>
            <span class="points">${p.totalCards === 0 ? 'OUT!' : 'Score pending'}</span>
        </div>`
    ).join('');
    
    const sortedPlayers = Object.entries(gameState.scores)
        .sort((a, b) => a[1] - b[1]);
    
    totalScores.innerHTML = sortedPlayers.map(([name, score]) => 
        `<div class="score-row">
            <span class="name">${name}</span>
            <span class="points">${score} pts</span>
        </div>`
    ).join('');
    
    document.getElementById('score-modal').classList.remove('hidden');
}

function nextRound() {
    document.getElementById('score-modal').classList.add('hidden');
    gameState.round++;
    gameState.gameStarted = true;
    dealCards();
    startRound();
}

function endGame() {
    showScoreModal();
}

function newGame() {
    document.getElementById('score-modal').classList.add('hidden');
    document.getElementById('game-area').classList.add('hidden');
    document.getElementById('mode-select').classList.remove('hidden');
    document.getElementById('ai-select').classList.add('hidden');
    
    gameState.scores = {};
    saveScores();
    
    gameState.gameStarted = false;
    gameState.round = 1;
}

document.addEventListener('DOMContentLoaded', init);
