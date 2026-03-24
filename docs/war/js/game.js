const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const VALUES = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
    '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

const STORAGE_KEY = 'war_stats';

let gameState = {
    deck: [],
    playerDeck: [],
    dealerDeck: [],
    warPile: [],
    stats: {
        roundsPlayed: 0,
        roundsWon: 0,
        warsWon: 0,
        warsLost: 0
    },
    isWar: false,
    gameOver: false
};

function init() {
    loadStats();
    setupEventListeners();
    startNewGame();
}

function loadStats() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        const data = JSON.parse(saved);
        gameState.stats = data.stats || gameState.stats;
    }
}

function saveStats() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ stats: gameState.stats }));
}

function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ suit, rank });
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

function startNewGame() {
    gameState.deck = createDeck();
    gameState.playerDeck = [];
    gameState.dealerDeck = [];
    gameState.warPile = [];
    gameState.isWar = false;
    gameState.gameOver = false;
    
    gameState.playerDeck = gameState.deck.slice(0, 26);
    gameState.dealerDeck = gameState.deck.slice(26);
    
    updateUI();
    document.getElementById('play-btn').classList.remove('hidden');
    document.getElementById('restart-btn').classList.add('hidden');
    document.getElementById('battle-result').textContent = '';
    document.getElementById('battle-result').className = 'battle-result';
    document.getElementById('war-pile').classList.add('hidden');
    document.getElementById('player-battle').innerHTML = '';
    document.getElementById('dealer-battle').innerHTML = '';
}

function setupEventListeners() {
    document.getElementById('play-btn').addEventListener('click', playRound);
    document.getElementById('restart-btn').addEventListener('click', startNewGame);
    
    document.getElementById('rules-btn').addEventListener('click', () => {
        document.getElementById('rules-modal').classList.remove('hidden');
    });
    document.getElementById('close-rules').addEventListener('click', () => {
        document.getElementById('rules-modal').classList.add('hidden');
    });
}

function playRound() {
    if (gameState.gameOver) return;
    
    gameState.stats.roundsPlayed++;
    
    document.getElementById('play-btn').disabled = true;
    setTimeout(() => {
        document.getElementById('play-btn').disabled = false;
    }, 1000);
    
    if (gameState.isWar) {
        executeWar();
    } else {
        drawCards();
    }
    
    updateUI();
}

function drawCards() {
    if (gameState.playerDeck.length === 0 || gameState.dealerDeck.length === 0) {
        endGame();
        return;
    }
    
    if (gameState.isWar) return;
    
    const playerCard = gameState.playerDeck.shift();
    const dealerCard = gameState.dealerDeck.shift();
    
    gameState.warPile = [playerCard, dealerCard];
    
    renderBattleCards(playerCard, dealerCard);
    
    const playerValue = VALUES[playerCard.rank];
    const dealerValue = VALUES[dealerCard.rank];
    
    setTimeout(() => {
        if (playerValue > dealerValue) {
            playerWinsRound();
        } else if (dealerValue > playerValue) {
            dealerWinsRound();
        } else {
            triggerWar();
        }
    }, 500);
}

function playerWinsRound() {
    document.getElementById('battle-result').textContent = 'YOU WIN!';
    document.getElementById('battle-result').className = 'battle-result win';
    
    gameState.stats.roundsWon++;
    saveStats();
    
    const shuffledPile = shuffleDeck(gameState.warPile);
    gameState.playerDeck.push(...shuffledPile);
    gameState.warPile = [];
    
    document.getElementById('war-pile').classList.add('hidden');
    gameState.isWar = false;
    
    setTimeout(() => {
        checkGameEnd();
        updateUI();
    }, 1000);
}

function dealerWinsRound() {
    document.getElementById('battle-result').textContent = 'DEALER WINS';
    document.getElementById('battle-result').className = 'battle-result lose';
    
    gameState.stats.warsLost++;
    saveStats();
    
    const shuffledPile = shuffleDeck(gameState.warPile);
    gameState.dealerDeck.push(...shuffledPile);
    gameState.warPile = [];
    
    document.getElementById('war-pile').classList.add('hidden');
    gameState.isWar = false;
    
    setTimeout(() => {
        checkGameEnd();
        updateUI();
    }, 1000);
}

function triggerWar() {
    document.getElementById('battle-result').textContent = 'WAR!';
    document.getElementById('battle-result').className = 'battle-result tie';
    
    document.getElementById('war-pile').classList.remove('hidden');
    document.getElementById('war-count').textContent = gameState.warPile.length;
    
    gameState.isWar = true;
    
    setTimeout(() => {
        executeWar();
    }, 1500);
}

function executeWar() {
    if (!gameState.isWar) return;
    
    if (gameState.playerDeck.length < 4 || gameState.dealerDeck.length < 4) {
        handleInsufficientCards();
        return;
    }
    
    for (let i = 0; i < 3; i++) {
        if (gameState.playerDeck.length > 0) {
            gameState.warPile.push(gameState.playerDeck.shift());
        }
        if (gameState.dealerDeck.length > 0) {
            gameState.warPile.push(gameState.dealerDeck.shift());
        }
    }
    
    const playerCard = gameState.playerDeck.shift();
    const dealerCard = gameState.dealerDeck.shift();
    
    gameState.warPile.push(playerCard, dealerCard);
    gameState.isWar = false;
    
    renderBattleCards(playerCard, dealerCard);
    document.getElementById('war-count').textContent = gameState.warPile.length;
    
    const playerValue = VALUES[playerCard.rank];
    const dealerValue = VALUES[dealerCard.rank];
    
    setTimeout(() => {
        if (playerValue > dealerValue) {
            playerWinsWar();
        } else if (dealerValue > playerValue) {
            dealerWinsWar();
        } else {
            triggerWar();
        }
    }, 500);
}

function playerWinsWar() {
    document.getElementById('battle-result').textContent = 'YOU WIN THE WAR!';
    document.getElementById('battle-result').className = 'battle-result win';
    
    gameState.stats.roundsWon++;
    gameState.stats.warsWon++;
    saveStats();
    
    const shuffledPile = shuffleDeck(gameState.warPile);
    gameState.playerDeck.push(...shuffledPile);
    gameState.warPile = [];
    
    document.getElementById('war-pile').classList.add('hidden');
    
    setTimeout(() => {
        checkGameEnd();
        updateUI();
    }, 1000);
}

function dealerWinsWar() {
    document.getElementById('battle-result').textContent = 'DEALER WINS THE WAR';
    document.getElementById('battle-result').className = 'battle-result lose';
    
    gameState.stats.warsLost++;
    saveStats();
    
    const shuffledPile = shuffleDeck(gameState.warPile);
    gameState.dealerDeck.push(...shuffledPile);
    gameState.warPile = [];
    
    document.getElementById('war-pile').classList.add('hidden');
    
    setTimeout(() => {
        checkGameEnd();
        updateUI();
    }, 1000);
}

function handleInsufficientCards() {
    if (gameState.playerDeck.length < 4 && gameState.dealerDeck.length < 4) {
        endGame();
    } else if (gameState.playerDeck.length < 4) {
        document.getElementById('battle-result').textContent = 'NOT ENOUGH CARDS - DEALER WINS';
        document.getElementById('battle-result').className = 'battle-result lose';
        gameState.dealerDeck.push(...gameState.playerDeck, ...gameState.warPile);
        gameState.playerDeck = [];
        gameState.warPile = [];
        setTimeout(endGame, 1500);
    } else {
        document.getElementById('battle-result').textContent = 'NOT ENOUGH CARDS - YOU WIN!';
        document.getElementById('battle-result').className = 'battle-result win';
        gameState.playerDeck.push(...gameState.dealerDeck, ...gameState.warPile);
        gameState.dealerDeck = [];
        gameState.warPile = [];
        setTimeout(endGame, 1500);
    }
}

function checkGameEnd() {
    if (gameState.playerDeck.length === 0 || gameState.dealerDeck.length === 0) {
        endGame();
    }
}

function endGame() {
    gameState.gameOver = true;
    
    document.getElementById('play-btn').classList.add('hidden');
    document.getElementById('restart-btn').classList.remove('hidden');
    
    const resultEl = document.getElementById('battle-result');
    if (gameState.playerDeck.length > gameState.dealerDeck.length) {
        resultEl.textContent = '🎉 YOU WIN THE GAME! 🎉';
        resultEl.className = 'battle-result win';
    } else {
        resultEl.textContent = '💀 DEALER WINS THE GAME 💀';
        resultEl.className = 'battle-result lose';
    }
    
    updateUI();
}

function renderBattleCards(playerCard, dealerCard) {
    document.getElementById('player-battle').innerHTML = '';
    document.getElementById('dealer-battle').innerHTML = '';
    
    document.getElementById('player-battle').appendChild(createCardElement(playerCard));
    document.getElementById('dealer-battle').appendChild(createCardElement(dealerCard));
}

function createCardElement(card) {
    const cardEl = document.createElement('div');
    const isRed = card.suit === '♥' || card.suit === '♦';
    cardEl.className = `card ${isRed ? 'red' : 'black'}`;
    cardEl.innerHTML = `
        <div class="rank">${card.rank}</div>
        <div class="suit">${card.suit}</div>
        <div class="rank-bottom">${card.rank}</div>
    `;
    return cardEl;
}

function updateUI() {
    document.getElementById('player-count').textContent = gameState.playerDeck.length;
    document.getElementById('dealer-count').textContent = gameState.dealerDeck.length;
    document.getElementById('rounds-won').textContent = gameState.stats.roundsWon;
    document.getElementById('total-rounds').textContent = gameState.stats.roundsPlayed;
    document.getElementById('wars-won').textContent = gameState.stats.warsWon;
    document.getElementById('wars-lost').textContent = gameState.stats.warsLost;
    
    if (gameState.warPile.length > 0) {
        document.getElementById('war-count').textContent = gameState.warPile.length;
    }
}

document.addEventListener('DOMContentLoaded', init);
