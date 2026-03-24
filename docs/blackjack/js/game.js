const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const VALUES = {
    'A': 11, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 10, 'Q': 10, 'K': 10
};

const STORAGE_KEY = 'blackjack_stats';
const MIN_BET = 1;
const MAX_BET = 100;
const STARTING_BANKROLL = 1000;

let gameState = {
    deck: [],
    playerHand: [],
    dealerHand: [],
    currentBet: 0,
    bankroll: STARTING_BANKROLL,
    stats: {
        handsPlayed: 0,
        handsWon: 0,
        handsLost: 0
    },
    phase: 'betting'
};

function init() {
    loadStats();
    setupEventListeners();
    updateUI();
}

function loadStats() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        const data = JSON.parse(saved);
        gameState.bankroll = data.bankroll || STARTING_BANKROLL;
        gameState.stats = data.stats || gameState.stats;
    }
}

function saveStats() {
    const data = {
        bankroll: gameState.bankroll,
        stats: gameState.stats
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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

function calculateHand(hand) {
    let value = 0;
    let aces = 0;

    for (const card of hand) {
        value += VALUES[card.rank];
        if (card.rank === 'A') aces++;
    }

    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }

    return value;
}

function setupEventListeners() {
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => addToBet(parseInt(chip.dataset.value)));
    });

    document.getElementById('clear-bet').addEventListener('click', clearBet);
    document.getElementById('deal-btn').addEventListener('click', deal);
    document.getElementById('hit-btn').addEventListener('click', hit);
    document.getElementById('stand-btn').addEventListener('click', stand);
    document.getElementById('double-btn').addEventListener('click', doubleDown);
    document.getElementById('split-btn').addEventListener('click', split);
    document.getElementById('new-game-btn').addEventListener('click', resetToBetting);

    document.getElementById('rules-btn').addEventListener('click', () => {
        document.getElementById('rules-modal').classList.remove('hidden');
    });
    document.getElementById('close-rules').addEventListener('click', () => {
        document.getElementById('rules-modal').classList.add('hidden');
    });
}

function addToBet(amount) {
    if (gameState.phase !== 'betting') return;
    
    const newBet = gameState.currentBet + amount;
    if (newBet > MAX_BET) {
        showMessage(`Max bet is $${MAX_BET}`, 'info');
        return;
    }
    if (newBet > gameState.bankroll) {
        showMessage('Not enough bankroll!', 'info');
        return;
    }
    
    gameState.currentBet = newBet;
    updateUI();
    
    if (gameState.currentBet >= MIN_BET) {
        document.getElementById('deal-btn').disabled = false;
    }
}

function clearBet() {
    gameState.currentBet = 0;
    updateUI();
    document.getElementById('deal-btn').disabled = true;
}

function deal() {
    if (gameState.currentBet < MIN_BET || gameState.currentBet > gameState.bankroll) return;
    
    gameState.deck = createDeck();
    gameState.playerHand = [];
    gameState.dealerHand = [];
    gameState.phase = 'playing';
    
    gameState.bankroll -= gameState.currentBet;
    
    gameState.playerHand.push(gameState.deck.pop());
    gameState.dealerHand.push(gameState.deck.pop());
    gameState.playerHand.push(gameState.deck.pop());
    gameState.dealerHand.push(gameState.deck.pop());
    
    clearTable();
    renderCards();
    updateUI();
    
    const playerScore = calculateHand(gameState.playerHand);
    const dealerUpCard = VALUES[gameState.dealerHand[0].rank];
    
    if (playerScore === 21) {
        dealerPlay();
        return;
    }
    
    if (canDoubleDown()) {
        document.getElementById('double-btn').disabled = false;
    }
    
    if (canSplit()) {
        document.getElementById('split-btn').classList.remove('hidden');
    }
    
    document.getElementById('bet-area').classList.add('hidden');
    document.getElementById('action-area').classList.remove('hidden');
    
    document.getElementById('player-score').textContent = `(${playerScore})`;
    document.getElementById('dealer-score').textContent = `(${dealerUpCard}+?)`;
}

function canDoubleDown() {
    return gameState.playerHand.length === 2 && 
           gameState.currentBet * 2 <= gameState.bankroll &&
           calculateHand(gameState.playerHand) >= 9 && 
           calculateHand(gameState.playerHand) <= 11;
}

function canSplit() {
    if (gameState.playerHand.length !== 2) return false;
    const [card1, card2] = gameState.playerHand;
    return card1.rank === card2.rank && gameState.currentBet * 2 <= gameState.bankroll;
}

function hit() {
    gameState.playerHand.push(gameState.deck.pop());
    renderCards();
    
    const score = calculateHand(gameState.playerHand);
    document.getElementById('player-score').textContent = `(${score})`;
    
    if (score > 21) {
        endRound('bust');
    } else if (score === 21) {
        stand();
    }
}

function stand() {
    dealerPlay();
}

function doubleDown() {
    gameState.bankroll -= gameState.currentBet;
    gameState.currentBet *= 2;
    
    gameState.playerHand.push(gameState.deck.pop());
    renderCards();
    
    const score = calculateHand(gameState.playerHand);
    document.getElementById('player-score').textContent = `(${score})`;
    
    if (score > 21) {
        endRound('bust');
    } else {
        dealerPlay();
    }
}

function split() {
    gameState.bankroll -= gameState.currentBet;
    
    const card1 = gameState.playerHand[0];
    const card2 = gameState.playerHand[1];
    
    gameState.playerHand = [card1];
    gameState.playerHand.push(gameState.deck.pop());
    
    gameState.splitHand = [card2];
    gameState.splitHand.push(gameState.deck.pop());
    gameState.hasSplit = true;
    gameState.splitCurrent = 'first';
    
    document.getElementById('split-btn').classList.add('hidden');
    document.getElementById('double-btn').classList.add('hidden');
    
    renderCards();
    updateUI();
    
    const score = calculateHand(gameState.playerHand);
    document.getElementById('player-score').textContent = `(${score})`;
    
    if (score > 21) {
        handleSplitBust();
    }
}

function handleSplitBust() {
    if (gameState.splitCurrent === 'first') {
        gameState.splitResult = 'lost';
        playSplitHand();
    } else {
        endSplitRound();
    }
}

function playSplitHand() {
    gameState.splitCurrent = 'second';
    const score = calculateHand(gameState.splitHand);
    document.getElementById('player-score').textContent = `(${score})`;
    showMessage('Second hand...', 'info');
}

function endSplitRound() {
    if (gameState.splitResult === 'lost' && calculateHand(gameState.splitHand) > 21) {
        endRound('split-bust');
    } else {
        gameState.playerHand = gameState.splitHand;
        gameState.currentBet *= 2;
        dealerPlay();
    }
}

function dealerPlay() {
    document.getElementById('action-area').classList.add('hidden');
    
    while (calculateHand(gameState.dealerHand) < 17) {
        gameState.dealerHand.push(gameState.deck.pop());
    }
    
    renderCards(true);
    
    const playerScore = calculateHand(gameState.playerHand);
    const dealerScore = calculateHand(gameState.dealerHand);
    
    document.getElementById('dealer-score').textContent = `(${dealerScore})`;
    
    if (dealerScore > 21) {
        endRound('dealer-bust');
    } else if (dealerScore > playerScore) {
        endRound('lose');
    } else if (dealerScore < playerScore) {
        endRound('win');
    } else {
        endRound('push');
    }
}

function endRound(result) {
    gameState.stats.handsPlayed++;
    
    let message = '';
    let messageClass = '';
    let winnings = 0;
    
    switch (result) {
        case 'blackjack':
            message = 'BLACKJACK!';
            messageClass = 'blackjack';
            winnings = gameState.currentBet * 2.5;
            gameState.stats.handsWon++;
            break;
        case 'win':
            message = 'YOU WIN!';
            messageClass = 'win';
            winnings = gameState.currentBet * 2;
            gameState.stats.handsWon++;
            break;
        case 'dealer-bust':
            message = 'DEALER BUSTS - YOU WIN!';
            messageClass = 'win';
            winnings = gameState.currentBet * 2;
            gameState.stats.handsWon++;
            break;
        case 'lose':
            message = 'DEALER WINS';
            messageClass = 'lose';
            winnings = 0;
            gameState.stats.handsLost++;
            break;
        case 'bust':
            message = 'BUST - YOU LOSE';
            messageClass = 'lose';
            winnings = 0;
            gameState.stats.handsLost++;
            break;
        case 'push':
            message = 'PUSH';
            messageClass = 'push';
            winnings = gameState.currentBet;
            break;
        case 'split-bust':
            message = 'BUST ON BOTH HANDS';
            messageClass = 'lose';
            winnings = 0;
            gameState.stats.handsLost++;
            gameState.stats.handsLost++;
            break;
    }
    
    gameState.bankroll += winnings;
    gameState.phase = 'result';
    
    showMessage(message, messageClass);
    updateUI();
    saveStats();
    
    if (gameState.bankroll <= 0) {
        setTimeout(() => {
            showMessage('GAME OVER - Out of chips!', 'lose');
            document.getElementById('result-area').innerHTML = 
                '<button onclick="location.reload()" class="btn btn-primary">Restart</button>';
            document.getElementById('result-area').classList.remove('hidden');
        }, 1500);
    } else {
        document.getElementById('result-area').classList.remove('hidden');
    }
}

function resetToBetting() {
    gameState.currentBet = 0;
    gameState.phase = 'betting';
    gameState.hasSplit = false;
    gameState.splitHand = null;
    
    clearTable();
    updateUI();
    
    document.getElementById('bet-area').classList.remove('hidden');
    document.getElementById('result-area').classList.add('hidden');
    document.getElementById('action-area').classList.add('hidden');
    document.getElementById('split-btn').classList.add('hidden');
    document.getElementById('deal-btn').disabled = true;
    
    showMessage('Place your bet', '');
}

function clearTable() {
    document.getElementById('player-cards').innerHTML = '';
    document.getElementById('dealer-cards').innerHTML = '';
    document.getElementById('player-score').textContent = '';
    document.getElementById('dealer-score').textContent = '';
}

function renderCards(revealDealer = false) {
    const playerArea = document.getElementById('player-cards');
    playerArea.innerHTML = '';
    
    for (const card of gameState.playerHand) {
        playerArea.appendChild(createCardElement(card));
    }
    
    if (gameState.hasSplit && gameState.splitHand) {
        playerArea.innerHTML += '<div class="split-divider">--- First Hand ---</div>';
        for (const card of gameState.playerHand) {
            playerArea.appendChild(createCardElement(card));
        }
        
        playerArea.innerHTML += '<div class="split-divider">--- Second Hand ---</div>';
        for (const card of gameState.splitHand) {
            playerArea.appendChild(createCardElement(card));
        }
    }
    
    const dealerArea = document.getElementById('dealer-cards');
    dealerArea.innerHTML = '';
    
    for (let i = 0; i < gameState.dealerHand.length; i++) {
        if (i === 1 && !revealDealer && gameState.phase !== 'result') {
            dealerArea.appendChild(createCardBack());
        } else {
            dealerArea.appendChild(createCardElement(gameState.dealerHand[i]));
        }
    }
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

function createCardBack() {
    const cardEl = document.createElement('div');
    cardEl.className = 'card back';
    return cardEl;
}

function showMessage(text, className) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = className;
}

function updateUI() {
    document.getElementById('bankroll').textContent = gameState.bankroll;
    document.getElementById('current-bet').textContent = gameState.currentBet;
    document.getElementById('hands-played').textContent = gameState.stats.handsPlayed;
    document.getElementById('hands-won').textContent = gameState.stats.handsWon;
    document.getElementById('hands-lost').textContent = gameState.stats.handsLost;
    
    if (canDoubleDown() && gameState.phase === 'playing') {
        document.getElementById('double-btn').classList.remove('hidden');
        document.getElementById('double-btn').disabled = false;
    } else {
        document.getElementById('double-btn').disabled = true;
    }
}

document.addEventListener('DOMContentLoaded', init);
