const SUITS = ['♣', '♦', '♥', '♠'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const STORAGE_KEY = 'klondike_stats';

let gameState = {
    stock: [],
    waste: [],
    foundations: [[], [], [], []],
    tableau: [[], [], [], [], [], [], []],
    drawMode: 1,
    moves: 0,
    selectedCard: null,
    selectedSource: null,
    gameStarted: false
};

let history = [];
let hintMove = null;

function init() {
    setupEventListeners();
    loadStats();
}

function setupEventListeners() {
    document.getElementById('draw1-btn').addEventListener('click', () => startGame(1));
    document.getElementById('draw3-btn').addEventListener('click', () => startGame(3));
    document.getElementById('rules-btn').addEventListener('click', () => {
        document.getElementById('rules-modal').classList.remove('hidden');
    });
    document.getElementById('close-rules').addEventListener('click', () => {
        document.getElementById('rules-modal').classList.add('hidden');
    });
    document.getElementById('new-game-btn').addEventListener('click', showModeSelect);
    document.getElementById('play-again-btn').addEventListener('click', () => {
        document.getElementById('win-modal').classList.add('hidden');
        showModeSelect();
    });
    document.getElementById('undo-btn').addEventListener('click', undoMove);
    document.getElementById('hint-btn').addEventListener('click', showHint);

    document.getElementById('rules-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('rules-modal')) {
            document.getElementById('rules-modal').classList.add('hidden');
        }
    });

    document.getElementById('stock').addEventListener('click', drawFromStock);
}

function showModeSelect() {
    document.getElementById('mode-select').classList.remove('hidden');
    document.getElementById('game-area').classList.add('hidden');
}

function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ suit, rank, faceUp: false });
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

function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function saveState() {
    history.push({
        stock: deepCopy(gameState.stock),
        waste: deepCopy(gameState.waste),
        foundations: deepCopy(gameState.foundations),
        tableau: deepCopy(gameState.tableau),
        moves: gameState.moves
    });
    if (history.length > 50) {
        history.shift();
    }
}

function undoMove() {
    if (history.length === 0) return;
    
    const prevState = history.pop();
    gameState.stock = prevState.stock;
    gameState.waste = prevState.waste;
    gameState.foundations = prevState.foundations;
    gameState.tableau = prevState.tableau;
    gameState.moves = prevState.moves;
    gameState.selectedCard = null;
    
    clearHint();
    updateUI();
}

function startGame(drawMode) {
    history = [];
    gameState = {
        stock: [],
        waste: [],
        foundations: [[], [], [], []],
        tableau: [[], [], [], [], [], [], []],
        drawMode,
        moves: 0,
        selectedCard: null,
        selectedSource: null,
        gameStarted: true
    };

    const deck = createDeck();
    let cardIndex = 0;

    for (let col = 0; col < 7; col++) {
        for (let row = 0; row <= col; row++) {
            const card = deck[cardIndex++];
            card.faceUp = row === col;
            gameState.tableau[col].push(card);
        }
    }

    gameState.stock = deck.slice(cardIndex);

    document.getElementById('mode-select').classList.add('hidden');
    document.getElementById('game-area').classList.remove('hidden');

    updateUI();
}

function drawFromStock() {
    saveState();
    clearHint();

    if (gameState.stock.length === 0) {
        if (gameState.waste.length > 0) {
            gameState.stock = gameState.waste.reverse().map(c => ({ ...c, faceUp: false }));
            gameState.waste = [];
            gameState.moves++;
            updateUI();
        }
    } else {
        const drawCount = Math.min(gameState.drawMode, gameState.stock.length);
        for (let i = 0; i < drawCount; i++) {
            const card = gameState.stock.pop();
            card.faceUp = true;
            gameState.waste.push(card);
        }
        gameState.moves++;
        updateUI();
    }
}

function isRed(suit) {
    return suit === '♥' || suit === '♦';
}

function isBlack(suit) {
    return suit === '♣' || suit === '♠';
}

function getCardValue(rank) {
    return RANKS.indexOf(rank) + 1;
}

function canMoveToFoundation(card, foundationIndex) {
    const foundation = gameState.foundations[foundationIndex];
    const foundationSuit = ['♣', '♦', '♥', '♠'][foundationIndex];

    if (card.suit !== foundationSuit) return false;

    if (foundation.length === 0) {
        return card.rank === 'A';
    }

    const topCard = foundation[foundation.length - 1];
    return getCardValue(card.rank) === getCardValue(topCard.rank) + 1;
}

function canMoveToTableau(card, columnIndex) {
    const column = gameState.tableau[columnIndex];

    if (column.length === 0) {
        return card.rank === 'K';
    }

    const topCard = column[column.length - 1];
    if (!topCard.faceUp) return false;

    const cardRed = isRed(card.suit);
    const topRed = isRed(topCard.suit);

    return cardRed !== topRed && getCardValue(card.rank) === getCardValue(topCard.rank) - 1;
}

function handleCardClick(card, source, sourceIndex, cardIndex) {
    clearHint();
    if (!card.faceUp) return;

    if (gameState.selectedCard) {
        if (gameState.selectedCard.card === card && gameState.selectedCard.source === source &&
            gameState.selectedCard.cardIndex === cardIndex) {
            clearSelection();
            return;
        }

        if (tryMoveCard(card, source, sourceIndex, cardIndex)) {
            clearSelection();
            return;
        }

        clearSelection();
    }

    if (card.faceUp) {
        gameState.selectedCard = { card, source, sourceIndex, cardIndex };
        highlightSelectedCard(source, sourceIndex, cardIndex);
    }
}

function tryMoveCard(targetCard, destSource, destSourceIndex, destCardIndex) {
    const { card, source, sourceIndex, cardIndex } = gameState.selectedCard;

    if (source === 'tableau') {
        const column = gameState.tableau[sourceIndex];
        if (cardIndex > column.length - 1) return false;
    } else if (source === 'waste') {
        const wasteTop = gameState.waste[gameState.waste.length - 1];
        if (card !== wasteTop) return false;
    }

    if (destSource === 'foundation') {
        if (source === 'tableau') {
            const column = gameState.tableau[sourceIndex];
            if (cardIndex !== column.length - 1) return false;
        }
        const cardToMove = source === 'waste' ? gameState.waste[gameState.waste.length - 1] :
                          gameState.tableau[sourceIndex][cardIndex];
        if (cardToMove !== card) return false;

        if (canMoveToFoundation(card, destSourceIndex)) {
            saveState();
            removeCardFromSource(source, sourceIndex, cardIndex);
            gameState.foundations[destSourceIndex].push(card);
            gameState.moves++;
            flipTopCard(sourceIndex);
            updateUI();
            checkWin();
            return true;
        }
    } else if (destSource === 'tableau') {
        if (canMoveToTableau(card, destSourceIndex)) {
            saveState();
            const cardsToMove = removeCardFromSource(source, sourceIndex, cardIndex);
            gameState.tableau[destSourceIndex].push(...cardsToMove);
            gameState.moves++;
            flipTopCard(sourceIndex);
            updateUI();
            return true;
        }
    }

    return false;
}

function removeCardFromSource(source, sourceIndex, cardIndex) {
    if (source === 'waste') {
        return [gameState.waste.pop()];
    } else if (source === 'tableau') {
        const column = gameState.tableau[sourceIndex];
        return column.splice(cardIndex);
    }
    return [];
}

function flipTopCard(tableauIndex) {
    const column = gameState.tableau[tableauIndex];
    if (column.length > 0 && !column[column.length - 1].faceUp) {
        column[column.length - 1].faceUp = true;
    }
}

function clearSelection() {
    gameState.selectedCard = null;
    document.querySelectorAll('.card.selected').forEach(el => el.classList.remove('selected'));
}

function highlightSelectedCard(source, sourceIndex, cardIndex) {
    document.querySelectorAll('.card.selected').forEach(el => el.classList.remove('selected'));

    if (source === 'waste') {
        const wasteCards = document.querySelectorAll('#waste .card');
        if (wasteCards.length > 0) {
            wasteCards[wasteCards.length - 1].classList.add('selected');
        }
    } else if (source === 'tableau') {
        const column = document.querySelector(`[data-col="${sourceIndex}"]`);
        const cards = column.querySelectorAll('.card');
        for (let i = cardIndex; i < cards.length; i++) {
            cards[i].classList.add('selected');
        }
    }
}

function tryAutoMoveToFoundation(card, source, sourceIndex, cardIndex) {
    if (source === 'tableau') {
        const column = gameState.tableau[sourceIndex];
        if (cardIndex !== column.length - 1) return false;
    } else if (source === 'waste') {
        const wasteTop = gameState.waste[gameState.waste.length - 1];
        if (card !== wasteTop) return false;
    }

    for (let i = 0; i < 4; i++) {
        if (canMoveToFoundation(card, i)) {
            saveState();
            removeCardFromSource(source, sourceIndex, cardIndex);
            gameState.foundations[i].push(card);
            gameState.moves++;
            flipTopCard(sourceIndex);
            updateUI();
            checkWin();
            return true;
        }
    }
    return false;
}

function findAllValidMoves() {
    const moves = [];

    if (gameState.waste.length > 0) {
        const card = gameState.waste[gameState.waste.length - 1];
        for (let i = 0; i < 4; i++) {
            if (canMoveToFoundation(card, i)) {
                moves.push({
                    type: 'foundation',
                    source: 'waste',
                    card: card,
                    destType: 'foundation',
                    destIndex: i,
                    priority: 2
                });
            }
        }
        for (let i = 0; i < 7; i++) {
            if (canMoveToTableau(card, i)) {
                moves.push({
                    type: 'tableau',
                    source: 'waste',
                    card: card,
                    destType: 'tableau',
                    destIndex: i,
                    priority: 1
                });
            }
        }
    }

    for (let col = 0; col < 7; col++) {
        const column = gameState.tableau[col];
        if (column.length === 0) continue;
        
        for (let cardIdx = 0; cardIdx < column.length; cardIdx++) {
            const card = column[cardIdx];
            if (!card.faceUp) continue;
            const isTopCard = cardIdx === column.length - 1;

            if (isTopCard) {
                for (let i = 0; i < 4; i++) {
                    if (canMoveToFoundation(card, i)) {
                        moves.push({
                            type: 'foundation',
                            source: 'tableau',
                            sourceIndex: col,
                            cardIndex: cardIdx,
                            card: card,
                            destType: 'foundation',
                            destIndex: i,
                            priority: 2
                        });
                    }
                }
            }

            for (let destCol = 0; destCol < 7; destCol++) {
                if (col === destCol) continue;
                if (canMoveToTableau(card, destCol)) {
                    moves.push({
                        type: 'tableau',
                        source: 'tableau',
                        sourceIndex: col,
                        cardIndex: cardIdx,
                        card: card,
                        destType: 'tableau',
                        destIndex: destCol,
                        priority: 1
                    });
                }
            }
        }
    }

    return moves;
}

function showHint() {
    clearHint();
    const moves = findAllValidMoves();
    
    if (moves.length === 0) {
        showMessage('No valid moves! Try drawing from stock.', 2000);
        return;
    }

    moves.sort((a, b) => b.priority - a.priority);
    hintMove = moves[0];

    const { source, sourceIndex, cardIndex, destType, destIndex } = hintMove;

    if (source === 'waste') {
        const wasteCards = document.querySelectorAll('#waste .card');
        if (wasteCards.length > 0) {
            wasteCards[wasteCards.length - 1].classList.add('hint');
        }
    } else if (source === 'tableau') {
        const column = document.querySelector(`[data-col="${sourceIndex}"]`);
        const cards = column.querySelectorAll('.card');
        for (let i = cardIndex; i < cards.length; i++) {
            cards[i].classList.add('hint');
        }
    }

    if (destType === 'foundation') {
        const foundations = document.querySelectorAll('.foundation');
        if (foundations[destIndex]) {
            foundations[destIndex].classList.add('hint-dest');
        }
    } else if (destType === 'tableau') {
        const columns = document.querySelectorAll('.tableau-column');
        if (columns[destIndex]) {
            columns[destIndex].classList.add('hint-dest');
        }
    }

    showMessage('Hint: Try moving the highlighted card(s)', 2000);
}

function clearHint() {
    hintMove = null;
    document.querySelectorAll('.hint').forEach(el => el.classList.remove('hint'));
    document.querySelectorAll('.hint-dest').forEach(el => el.classList.remove('hint-dest'));
}

function showMessage(text, duration) {
    const messageEl = document.getElementById('message');
    const originalContent = messageEl.innerHTML;
    
    messageEl.innerHTML = `<div class="temp-message">${text}</div>` + messageEl.innerHTML;
    
    setTimeout(() => {
        messageEl.innerHTML = originalContent;
    }, duration);
}

function createCardElement(card, source, sourceIndex, cardIndex) {
    const el = document.createElement('div');
    el.className = `card ${card.faceUp ? (isRed(card.suit) ? 'red' : 'black') : 'face-down'}`;

    if (card.faceUp) {
        el.innerHTML = `
            <span class="rank">${card.rank}</span>
            <span class="suit">${card.suit}</span>
        `;

        el.addEventListener('click', () => handleCardClick(card, source, sourceIndex, cardIndex));
        el.addEventListener('dblclick', () => {
            if (!tryAutoMoveToFoundation(card, source, sourceIndex, cardIndex)) {
                handleCardClick(card, source, sourceIndex, cardIndex);
            }
        });
    }

    return el;
}

function renderStock() {
    const stockEl = document.getElementById('stock');
    stockEl.innerHTML = '<span class="pile-label">Stock</span>';
    stockEl.classList.toggle('has-cards', gameState.stock.length > 0);
    stockEl.classList.toggle('empty', gameState.stock.length === 0);
}

function renderWaste() {
    const wasteEl = document.getElementById('waste');
    wasteEl.innerHTML = '<span class="pile-label">Waste</span>';

    gameState.waste.forEach((card, index) => {
        const cardEl = createCardElement(card, 'waste', 0, index);
        wasteEl.appendChild(cardEl);
    });
}

function renderFoundations() {
    const foundationsEl = document.getElementById('foundations');

    foundationsEl.querySelectorAll('.foundation').forEach((el, index) => {
        el.innerHTML = `<span class="pile-label">${['♣', '♦', '♥', '♠'][index]}</span>`;
        el.classList.remove('complete');

        const foundation = gameState.foundations[index];
        if (foundation.length > 0) {
            el.classList.remove('empty');
            const topCard = foundation[foundation.length - 1];
            const cardEl = createCardElement(topCard, 'foundation', index, foundation.length - 1);
            cardEl.style.position = 'absolute';
            cardEl.style.top = '50%';
            cardEl.style.left = '50%';
            cardEl.style.transform = 'translate(-50%, -50%)';
            el.appendChild(cardEl);

            if (foundation.length === 13) {
                el.classList.add('complete');
            }
        } else {
            el.classList.add('empty');
        }
    });
}

function renderTableau() {
    const tableauEl = document.getElementById('tableau');

    tableauEl.querySelectorAll('.tableau-column').forEach((colEl, colIndex) => {
        colEl.innerHTML = '';

        gameState.tableau[colIndex].forEach((card, cardIndex) => {
            const cardEl = createCardElement(card, 'tableau', colIndex, cardIndex);
            cardEl.style.top = `${cardIndex * 25}px`;
            colEl.appendChild(cardEl);
        });

        colEl.addEventListener('click', (e) => {
            if (e.target === colEl && gameState.selectedCard) {
                if (gameState.selectedCard.source === 'tableau' || gameState.selectedCard.source === 'waste') {
                    if (canMoveToTableau(gameState.selectedCard.card, colIndex)) {
                        tryMoveCard(null, 'tableau', colIndex, 0);
                        clearSelection();
                    }
                }
            }
        });

        colEl.querySelectorAll('.foundation').forEach((foundEl) => {
            foundEl.addEventListener('click', () => {
                if (gameState.selectedCard && gameState.selectedCard.source !== 'foundation') {
                    const foundIndex = parseInt(foundEl.dataset.foundation);
                    if (canMoveToFoundation(gameState.selectedCard.card, foundIndex)) {
                        tryMoveCard(null, 'foundation', foundIndex, 0);
                        clearSelection();
                    }
                }
            });
        });
    });
}

function updateUI() {
    renderStock();
    renderWaste();
    renderFoundations();
    renderTableau();
    updateMessage();
}

function updateMessage() {
    const messageEl = document.getElementById('message');
    const stats = getStats();

    let cardsInFoundation = 0;
    gameState.foundations.forEach(f => cardsInFoundation += f.length);

    const undoBtn = document.getElementById('undo-btn');
    undoBtn.disabled = history.length === 0;

    messageEl.innerHTML = `
        <div class="stats-display">
            <div class="stat">Moves: <span>${gameState.moves}</span></div>
            <div class="stat">Foundations: <span>${cardsInFoundation}/52</span></div>
            <div class="stat">Games Won: <span>${stats.gamesWon}</span></div>
        </div>
    `;
}

function checkWin() {
    const totalInFoundations = gameState.foundations.reduce((sum, f) => sum + f.length, 0);

    if (totalInFoundations === 52) {
        saveWin(gameState.moves);
        document.getElementById('win-stats').textContent = `Completed in ${gameState.moves} moves!`;
        document.getElementById('win-modal').classList.remove('hidden');
    }
}

function getStats() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : { gamesWon: 0, bestScore: Infinity };
}

function saveWin(moves) {
    const stats = getStats();
    stats.gamesWon++;
    if (moves < stats.bestScore) {
        stats.bestScore = moves;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

function loadStats() {
    const stats = getStats();
}

document.addEventListener('DOMContentLoaded', init);
