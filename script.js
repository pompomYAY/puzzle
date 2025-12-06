const words = ['POMPOM', 'MUFFIN', 'MACAROON', 'BAGEL', 'SCONE', 'EIMBEAN', 'ILOVEYOU', 'DRINKWATER'];
const GRID_ROWS = 14;
const GRID_COLS = 10;

let grid = [];
let selectedCells = [];
let foundWords = new Set();
let isDragging = false;
let isTouchDrag = false;
let lastDragKey = null;
let dragStartTime = 0;
let globalListenersBound = false;

function initializePuzzle() {
	grid = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(''));
	selectedCells = [];
	foundWords.clear();
	
	placeWords();
	
	fillEmptyCells();
	
	renderGrid();
	renderWordList();
	renderWords();
}

function placeWords() {
	const directions = [
		{ dx: 1, dy: 0 },
		{ dx: 0, dy: 1 },
		{ dx: 1, dy: 1 },
		{ dx: -1, dy: 1 }
	];
	
	for (const word of words.copyWithin(0).sort(() => Math.random() - 0.5)) {
		let placed = false;
		let attempts = 0;
		
		while (!placed && attempts < 800) {
			const direction = directions[Math.floor(Math.random() * directions.length)];
			const row = Math.floor(Math.random() * GRID_ROWS);
			const col = Math.floor(Math.random() * GRID_COLS);
			
			if (canPlaceWord(word, row, col, direction)) {
				for (let i = 0; i < word.length; i++) {
					const r = row + i * direction.dy;
					const c = col + i * direction.dx;
					grid[r][c] = word[i];
				}
				placed = true;
			}
			attempts++;
		}
	}
}

function canPlaceWord(word, startRow, startCol, direction) {
	for (let i = 0; i < word.length; i++) {
		const row = startRow + i * direction.dy;
		const col = startCol + i * direction.dx;
		
		if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) {
			return false;
		}
		
		if (grid[row][col] !== '' && grid[row][col] !== word[i]) {
			return false;
		}
	}
	return true;
}

function fillEmptyCells() {
	const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	for (let i = 0; i < GRID_ROWS; i++) {
		for (let j = 0; j < GRID_COLS; j++) {
			if (grid[i][j] === '') {
				grid[i][j] = letters[Math.floor(Math.random() * letters.length)];
			}
		}
	}
}

function renderGrid() {
	const gridElement = document.getElementById('grid');
	gridElement.innerHTML = '';
	gridElement.style.gridTemplateColumns = `repeat(${GRID_COLS}, 1fr)`;
	
	for (let i = 0; i < GRID_ROWS; i++) {
		for (let j = 0; j < GRID_COLS; j++) {
			const cell = document.createElement('div');
			cell.className = 'cell';
			cell.textContent = grid[i][j];
			cell.dataset.row = i;
			cell.dataset.col = j;
			
			cell.addEventListener('mousedown', (e) => startDrag(i, j, cell, e));
			cell.addEventListener('mouseenter', () => dragOver(i, j, cell));
			cell.addEventListener('mouseup', () => endDrag());
			
			cell.addEventListener('touchstart', (e) => startDrag(i, j, cell, e));
			cell.addEventListener('touchmove', (e) => handleTouchMove(e));
			cell.addEventListener('touchend', () => endDrag());
			
			gridElement.appendChild(cell);
		}
	}
	
	if (!globalListenersBound) {
		document.addEventListener('mouseup', endDrag);
		document.addEventListener('touchend', endDrag);
		globalListenersBound = true;
	}
}

function startDrag(row, col, cellElement, event) {
	event.preventDefault();
	isDragging = true;
	isTouchDrag = event.type.startsWith('touch');
	lastDragKey = null;
	dragStartTime = Date.now();
	toggleCell(row, col);
}

function dragOver(row, col, cellElement) {
	if (isDragging && !isTouchDrag) {
		toggleCell(row, col);
	}
}

function endDrag() {
	if (isDragging) {
		isDragging = false;
		isTouchDrag = false;
		lastDragKey = null;
		checkForWords();
	}
}

function handleTouchMove(event) {
	if (!isDragging) return;
	event.preventDefault();
	const touch = event.touches[0];
	const element = document.elementFromPoint(touch.clientX, touch.clientY);
	
	if (element && element.classList.contains('cell')) {
		const row = parseInt(element.dataset.row);
		const col = parseInt(element.dataset.col);
		toggleCell(row, col);
	}
}

function toggleCell(row, col) {
	const cellKey = `${row},${col}`;
	if (cellKey === lastDragKey) return;
	const isSelected = selectedCells.some(c => c.key === cellKey);
	
	if (isSelected) {
		selectedCells = selectedCells.filter(c => c.key !== cellKey);
	} else {
		selectedCells.push({ row, col, key: cellKey });
	}

	lastDragKey = cellKey;
	updateCellDisplay();
}

function updateCellDisplay() {
	const cells = document.querySelectorAll('.cell');
	cells.forEach(cell => {
		const row = parseInt(cell.dataset.row);
		const col = parseInt(cell.dataset.col);
		const key = `${row},${col}`;
		
		cell.classList.remove('selected');
		
		if (selectedCells.some(c => c.key === key)) {
			cell.classList.add('selected');
		}
	});
}

function checkForWords() {
	if (selectedCells.length === 0) return;
	
	const selectedText = selectedCells.map(c => grid[c.row][c.col]).join('');
	
	if (words.includes(selectedText)) {
		markWordAsFound(selectedText);
		selectedCells = [];
		updateCellDisplay();
	} else if (words.includes(selectedText.split('').reverse().join(''))) {
		markWordAsFound(selectedText.split('').reverse().join(''));
		selectedCells = [];
		updateCellDisplay();
	}
}

function markWordAsFound(word) {
	if (!foundWords.has(word)) {
		foundWords.add(word);
		
		const cells = document.querySelectorAll('.cell');
		for (const cell of cells) {
			if (foundWords.size === words.length) break;
			
			const row = parseInt(cell.dataset.row);
			const col = parseInt(cell.dataset.col);
			
			for (const selectedCell of selectedCells) {
				if (selectedCell.row === row && selectedCell.col === col) {
					cell.classList.add('found');
				}
			}
		}
		
		renderWordList();
		checkCompletion();
	}
}

function checkCompletion() {
	if (foundWords.size === words.length) {
		showCompletionMessage();
	}
}

function showCompletionMessage() {
	const puzzleSection = document.querySelector('.puzzle-section');
	if (!puzzleSection) return;

	const completion = document.getElementById('completionMessage');
	const resetBtn = document.getElementById('resetBtn');

	if (resetBtn) resetBtn.remove();
	if (completion) {
		puzzleSection.classList.add('hidden');
		completion.classList.remove('hidden');
		createConfetti();
		
		// Add click listener to Next Game button
		const nextGameBtn = document.getElementById('nextGameBtn');
		if (nextGameBtn) {
			nextGameBtn.onclick = () => startCharacterClikerGame();
		}
	}
}

function createConfetti() {
	const confettiContainer = document.createElement('div');
	confettiContainer.id = 'confetti-container';
	document.body.appendChild(confettiContainer);

	const colors = ['#ffd54f', '#d4a373', '#f9b233', '#ffcc80', '#ffe082', '#ffe0b2'];
	
	for (let i = 0; i < 70; i++) {
		const confetti = document.createElement('div');
		confetti.className = 'confetti';
		confetti.style.left = Math.random() * 100 + '%';
		confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
		confetti.style.animationDelay = Math.random() * 0.4 + 's';
		confetti.style.animationDuration = (Math.random() * 1.8 + 2) + 's';
		confettiContainer.appendChild(confetti);
	}
	
	setTimeout(() => {
		confettiContainer.remove();
	}, 4000);
}
// showCompletionMessage()

window.showCompletionMessage = showCompletionMessage;

// Character Clicker Minigame
const CHARACTER_IMAGES = [
	'Clickables/BiscuitClickable.png',
	'Clickables/MacaroonClickable.png',
	'Clickables/MuffinClickable.png',
	'Clickables/PomPomClickable.png'
];

// Wordle constants/state
const WORDLE_ANSWER = 'BAGEL';
const WORDLE_MAX_ATTEMPTS = 5;
let wordleGuesses = [];
let wordleActive = false;
let wordleCurrentGuess = '';
let wordleHelpVisible = false;

let charactersClicked = 0;
let totalCharacters = 9;
const CLICKER_GOAL = 30;
const CLICKER_TIME_LIMIT = 30;
const charactersToPress = CLICKER_GOAL;
let activeCharacters = [];
let animationFrameId = null;
let clickerTimeLeft = CLICKER_TIME_LIMIT;
let clickerTimerId = null;
let clickerRoundActive = false;
let clickerEndTime = null;

function startCharacterClikerGame() {
	resetClickerState();

	const completionMessage = document.getElementById('completionMessage');
	const clickerSection = document.getElementById('characterClickerSection');

	if (completionMessage && clickerSection) {
		completionMessage.classList.add('hidden');
		clickerSection.classList.remove('hidden');
		updateClickerProgress();
		updateClickerTimerDisplay();
	}
}

function resetClickerState() {
	charactersClicked = 0;
	activeCharacters = [];
	clickerTimeLeft = CLICKER_TIME_LIMIT;
	clickerRoundActive = false;
	clearInterval(clickerTimerId);
	clickerTimerId = null;

	if (animationFrameId) {
		cancelAnimationFrame(animationFrameId);
		animationFrameId = null;
	}

	const gameContainer = document.getElementById('charactersGame');
	if (gameContainer) gameContainer.innerHTML = '';

	const stopClickerBtn = document.getElementById('stopClickerBtn');
	if (stopClickerBtn) stopClickerBtn.style.display = 'none';
	const startClickerBtn = document.getElementById('startClickerBtn');
	if (startClickerBtn) startClickerBtn.disabled = false;
}

function spawnCharacters() {
	const gameContainer = document.getElementById('charactersGame');
	
	// Spawn characters to reach totalCharacters on screen
	while (activeCharacters.length < totalCharacters) {
		const character = createCharacter();
		gameContainer.appendChild(character);
		activeCharacters.push(character);
	}
}

function createCharacter() {
	const container = document.getElementById('charactersGame');
	const char = document.createElement('div');
	char.className = 'clickable-character';
	
	const img = document.createElement('img');
	img.src = CHARACTER_IMAGES[Math.floor(Math.random() * CHARACTER_IMAGES.length)];
	img.alt = 'Character';
	
	char.appendChild(img);
	
	// Use actual container dimensions; fall back if zero
	const containerWidth = container.offsetWidth || 320;
	const containerHeight = container.offsetHeight || 300;
	const charWidth = 60;
	const charHeight = 60;
	
	let x = Math.random() * (containerWidth - charWidth);
	let y = Math.random() * (containerHeight - charHeight);
	// Ensure velocity is not zero and is noticeable
	let vx = (Math.random() * 2 + 1) * (Math.random() < 0.5 ? -1 : 1); // -3 to -1 or 1 to 3
	let vy = (Math.random() * 2 + 1) * (Math.random() < 0.5 ? -1 : 1);
	
	char.dataset.x = x;
	char.dataset.y = y;
	char.dataset.vx = vx;
	char.dataset.vy = vy;
	char.dataset.clicked = false;
	
	updateCharacterPosition(char, container);
	
	char.addEventListener('click', (e) => {
		e.stopPropagation();
		clickCharacter(char);
	});
	
	return char;
}

function updateCharacterPosition(char, container) {
	const x = parseFloat(char.dataset.x);
	const y = parseFloat(char.dataset.y);
	char.style.transform = `translate(${x}px, ${y}px)`;
}

function startCharacterAnimationLoop() {
	const container = document.getElementById('charactersGame');
	if (!container) return;

	const step = () => {
		animateCharacters(container);
		animationFrameId = requestAnimationFrame(step);
	};

	animationFrameId = requestAnimationFrame(step);
}

function animateCharacters(container) {
	const charWidth = 60;
	const charHeight = 60;
	const padding = 5;

	// Use container's actual dimensions; default if zero
	const containerWidth = container.offsetWidth || 320;
	const containerHeight = container.offsetHeight || 300;

	for (const char of activeCharacters) {
		if (char.dataset.clicked === 'true' || !document.body.contains(char)) {
			continue;
		}

		let x = parseFloat(char.dataset.x) || 0;
		let y = parseFloat(char.dataset.y) || 0;
		let vx = parseFloat(char.dataset.vx) || 2;
		let vy = parseFloat(char.dataset.vy) || 2;

		x += vx;
		y += vy;

		if (x <= padding) {
			x = padding;
			vx = Math.abs(vx);
		}
		if (x + charWidth >= containerWidth - padding) {
			x = containerWidth - charWidth - padding;
			vx = -Math.abs(vx);
		}
		if (y <= padding) {
			y = padding;
			vy = Math.abs(vy);
		}
		if (y + charHeight >= containerHeight - padding) {
			y = containerHeight - charHeight - padding;
			vy = -Math.abs(vy);
		}

		char.dataset.x = x.toString();
		char.dataset.y = y.toString();
		char.dataset.vx = vx.toString();
		char.dataset.vy = vy.toString();

		updateCharacterPosition(char, container);
	}
}

function clickCharacter(char) {
	if (!clickerRoundActive || char.dataset.clicked === 'true') return;
	
	char.dataset.clicked = 'true';
	char.classList.add('clicked');
	
	charactersClicked++;
	updateClickerProgress();

	// Upward drift animation then cleanup
	const x = parseFloat(char.dataset.x) || 0;
	const y = parseFloat(char.dataset.y) || 0;
	const driftX = (Math.random() * 260 - 130);
	const apexY = y - (80 + Math.random() * 80);
	const rot = (Math.random() * 120 + 120) * (Math.random() < 0.5 ? -1 : 1);

	char.animate([
		{ transform: `translate(${x}px, ${y}px) rotate(0deg)`, opacity: 1 },
		{ transform: `translate(${x + driftX}px, ${apexY}px) rotate(${rot}deg)`, opacity: 0 }
	], {
		duration: 650,
		easing: 'ease-out',
		fill: 'forwards'
	}).onfinish = () => {
		char.remove();
		activeCharacters = activeCharacters.filter(c => c !== char);
		if (charactersClicked < charactersToPress) {
			spawnCharacters();
		} else {
			onClickerSuccess();
		}
	};
}

function updateClickerProgress() {
	const progress = document.getElementById('clickerProgress');
	if (progress) {
		progress.textContent = `Sent to POM POM heaven: ${charactersClicked} / ${charactersToPress}`;
	}
}

function updateClickerTimerDisplay() {
	const timerEl = document.getElementById('clickerTimer');
	if (timerEl) {
		const display = clickerTimeLeft <= 5 ? clickerTimeLeft.toFixed(1) : Math.ceil(clickerTimeLeft);
		timerEl.textContent = `Time remaining: ${display}s`;
	}
}

function startClickerRound() {
	if (clickerRoundActive) return;
	resetClickerState();
	spawnCharacters();
	updateClickerProgress();
	clickerRoundActive = true;
	const stopClickerBtn = document.getElementById('stopClickerBtn');
	if (stopClickerBtn) stopClickerBtn.style.display = 'inline-block';
	const startClickerBtn = document.getElementById('startClickerBtn');
	if (startClickerBtn) startClickerBtn.disabled = true;
	updateClickerTimerDisplay();
	startCharacterAnimationLoop();
	clickerEndTime = performance.now() + CLICKER_TIME_LIMIT * 1000;
	clickerTimerId = setInterval(() => {
		const remainingMs = Math.max(0, clickerEndTime - performance.now());
		clickerTimeLeft = remainingMs / 1000;
		updateClickerTimerDisplay();
		if (remainingMs <= 0) {
			onClickerFail();
		}
	}, 100);
}

function stopClickerRound(messageText) {
	clickerRoundActive = false;
	clearInterval(clickerTimerId);
	clickerTimerId = null;
 	clickerEndTime = null;
	if (animationFrameId) {
		cancelAnimationFrame(animationFrameId);
		animationFrameId = null;
	}
	if (messageText) {
		const progress = document.getElementById('clickerProgress');
		if (progress) progress.textContent = messageText;
	}
	const gameContainer = document.getElementById('charactersGame');
	if (gameContainer) gameContainer.innerHTML = '';
	activeCharacters = [];
	const stopClickerBtn = document.getElementById('stopClickerBtn');
	if (stopClickerBtn) stopClickerBtn.style.display = 'none';
	const startClickerBtn = document.getElementById('startClickerBtn');
	if (startClickerBtn) startClickerBtn.disabled = false;
}

function onClickerFail() {
	stopClickerRound('Nooo you we\'re so close!');
	charactersClicked = 0;
}

function onClickerSuccess() {
	stopClickerRound();
	completeClickerGame();
}

function completeClickerGame() {
	const clickerSection = document.getElementById('characterClickerSection');
	const clickerCompletion = document.getElementById('clickerCompletion');
	const wordleSection = document.getElementById('wordleSection');
	stopClickerRound();

	// Fade out any remaining characters
	for (const char of activeCharacters) {
		if (!document.body.contains(char)) continue;
		char.dataset.clicked = 'true';
		char.classList.add('clicked');
	}
	
	// Clear all characters from the game container
	const gameContainer = document.getElementById('charactersGame');
	if (gameContainer) {
		setTimeout(() => {
			gameContainer.innerHTML = '';
			activeCharacters = [];
		}, 320);
	}
	
	createConfetti();

	// Show completion panel similar to word search completion
	if (clickerSection) clickerSection.classList.add('hidden');
	if (clickerCompletion) {
		clickerCompletion.classList.remove('hidden');
		const toWordleBtn = document.getElementById('toWordleBtn');
		if (toWordleBtn) {
			toWordleBtn.onclick = () => {
				clickerCompletion.classList.add('hidden');
				if (wordleSection) {
					wordleSection.classList.remove('hidden');
					startWordleGame();
				}
			};
		}
	} else if (wordleSection) {
		wordleSection.classList.remove('hidden');
		startWordleGame();
	}
}

// Wordle helpers
function startWordleGame() {
	wordleActive = true;
	wordleGuesses = [];
	wordleCurrentGuess = '';
	wordleHelpVisible = false;
	const grid = document.getElementById('wordleGrid');
	const message = document.getElementById('wordleMessage');
	if (message) message.textContent = '';
	resetWordleHelpUI();
	if (grid) {
		grid.innerHTML = '';
		for (let i = 0; i < WORDLE_MAX_ATTEMPTS; i++) {
			for (let j = 0; j < WORDLE_ANSWER.length; j++) {
				const cell = document.createElement('div');
				cell.className = 'wordle-cell';
				cell.dataset.row = i;
				cell.dataset.col = j;
				grid.appendChild(cell);
			}
		}
	}
	buildWordleKeyboard();
	renderWordleState();
}

function resetWordleHelpUI() {
	const helpText = document.getElementById('wordleHelpText');
	const helpToggle = document.getElementById('wordleHelpToggle');
	if (helpText) helpText.classList.add('hidden');
	if (helpToggle) helpToggle.textContent = 'Press here if you don\'t';
}

function resetWordleGameWithMessage(text) {
	const message = document.getElementById('wordleMessage');
	if (message) message.textContent = text;
	setTimeout(() => startWordleGame(), 2300);
}

const tryAgainMessages = [
	'Almost.. I think?',
	'I believe in you!',
	'Hint: No hints!',
	'I\'m running out of ideas...',
	'Womble Womble!'
];

function handleWordleSubmit() {
	if (!wordleActive) return;
	const message = document.getElementById('wordleMessage');

	const guessRaw = wordleCurrentGuess.trim().toUpperCase();
	if (guessRaw.length !== WORDLE_ANSWER.length) {
		if (message) message.textContent = 'Needs to be 5 letters!';
		return;
	}

	if (wordleGuesses.length >= WORDLE_MAX_ATTEMPTS) return;
	wordleGuesses.push(guessRaw);
	renderWordleState();

	if (guessRaw === WORDLE_ANSWER) {
		completeWordleGame();
		return;
	}

	if (wordleGuesses.length >= WORDLE_MAX_ATTEMPTS) {
		resetWordleGameWithMessage('Good try! I\'ll give you another chance because I love you.');
		return;
	}

	wordleCurrentGuess = '';
	if (message) message.textContent = tryAgainMessages[Math.min(wordleGuesses.length - 1, tryAgainMessages.length - 1)];
	renderWordleState();
}

function renderWordleState() {
	const grid = document.getElementById('wordleGrid');
	if (!grid) return;
	const cells = grid.querySelectorAll('.wordle-cell');
	const answerArr = WORDLE_ANSWER.split('');

	// Reset all cells before applying state
	cells.forEach(cell => {
		cell.textContent = '';
		cell.classList.remove('filled', 'correct', 'present', 'absent', 'wave-cell');
	});

	wordleGuesses.forEach((guess, row) => {
		const guessArr = guess.split('');
		const letterCount = {};
		answerArr.forEach(ch => { letterCount[ch] = (letterCount[ch] || 0) + 1; });

		// First pass: correct positions
		const states = Array(guessArr.length).fill('absent');
		for (let i = 0; i < guessArr.length; i++) {
			if (guessArr[i] === answerArr[i]) {
				states[i] = 'correct';
				letterCount[guessArr[i]] -= 1;
			}
		}
		// Second pass: present elsewhere
		for (let i = 0; i < guessArr.length; i++) {
			if (states[i] === 'correct') continue;
			if (letterCount[guessArr[i]] > 0) {
				states[i] = 'present';
				letterCount[guessArr[i]] -= 1;
			}
		}

		for (let col = 0; col < guessArr.length; col++) {
			const idx = row * WORDLE_ANSWER.length + col;
			const cell = cells[idx];
			if (!cell) continue;
			cell.textContent = guessArr[col];
			cell.classList.add('filled');
			cell.classList.remove('correct', 'present', 'absent');
			cell.classList.add(states[col]);
		}
	});

	// Render current in-progress guess on next row
	const currentRow = wordleGuesses.length;
	for (let i = 0; i < wordleCurrentGuess.length; i++) {
		const idx = currentRow * WORDLE_ANSWER.length + i;
		const cell = cells[idx];
		if (!cell) continue;
		cell.textContent = wordleCurrentGuess[i];
		cell.classList.add('filled', 'wave-cell');
	}
}

function completeWordleGame() {
	wordleActive = false;
	const wordleSection = document.getElementById('wordleSection');
	const finalCompletion = document.getElementById('finalCompletion');
	createConfetti();
	setTimeout(() => {
		if (wordleSection) wordleSection.classList.add('hidden');
		if (finalCompletion) finalCompletion.classList.remove('hidden');
	}, 800);
}

function renderWordList() {
	const wordListElement = document.getElementById('wordList');
	wordListElement.innerHTML = '';
	
	for (const word of words) {
		const wordItem = document.createElement('div');
		wordItem.className = 'word-item';
		if (foundWords.has(word)) {
			wordItem.classList.add('found');
		}
		wordItem.textContent = word;
		wordListElement.appendChild(wordItem);
	}
}

function renderWords() {
	const cells = document.querySelectorAll('.cell');
	cells.forEach(cell => {
		const row = parseInt(cell.dataset.row);
		const col = parseInt(cell.dataset.col);
		let isCellFound = false;
		
		for (const word of foundWords) {
			if (isPartOfWord(row, col, word)) {
				isCellFound = true;
				break;
			}
		}
		
		if (isCellFound) {
			cell.classList.add('found');
		}
	});
}

function isPartOfWord(row, col, word) {
	const directions = [
		{ dx: 1, dy: 0 },
		{ dx: 0, dy: 1 },
		{ dx: 1, dy: 1 },
		{ dx: -1, dy: 1 }
	];
	
	for (const direction of directions) {
		for (let start = 0; start < word.length; start++) {
			let matches = true;
			for (let i = 0; i < word.length; i++) {
				const r = row + (i - start) * direction.dy;
				const c = col + (i - start) * direction.dx;
				
				if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS || grid[r][c] !== word[i]) {
					matches = false;
					break;
				}
			}
			if (matches) return true;
		}
	}
	return false;
}

const resetBtn = document.getElementById('resetBtn')
if (resetBtn) {
	resetBtn.addEventListener('click', initializePuzzle);
}

function applyWaveEffect(element) {
	const text = element.textContent;
	element.innerHTML = '';
	
	let delay = 0;
	for (let char of text) {
		if (char === ' ') {
			element.appendChild(document.createTextNode(' '));
		} else {
			const span = document.createElement('span');
			span.className = 'wave-letter';
			span.textContent = char;
			span.style.animationDelay = `${delay * 0.08}s`;
			element.appendChild(span);
		}
		delay++;
	}
}

document.addEventListener('DOMContentLoaded', () => {
	initializePuzzle();
	
	const h1 = document.querySelector('h1');
	const h2s = document.querySelectorAll('h2');
	const waveTexts = document.querySelectorAll('.wave');
	waveTexts.forEach(el => applyWaveEffect(el));
	
	if (h1) applyWaveEffect(h1);
	h2s.forEach(h2 => applyWaveEffect(h2));

	const wordleSubmit = document.getElementById('wordleSubmit');
	if (wordleSubmit) wordleSubmit.onclick = handleWordleSubmit;
	buildWordleKeyboard();

	const startClickerBtn = document.getElementById('startClickerBtn');
	const stopClickerBtn = document.getElementById('stopClickerBtn');
	if (startClickerBtn) startClickerBtn.addEventListener('click', startClickerRound);
	if (stopClickerBtn) stopClickerBtn.addEventListener('click', () => stopClickerRound('Force stopped.. Okay interesting'));

	const helpToggle = document.getElementById('wordleHelpToggle');
	if (helpToggle) {
		helpToggle.addEventListener('click', () => {
			wordleHelpVisible = !wordleHelpVisible;
			const helpText = document.getElementById('wordleHelpText');
			if (helpText) {
				helpText.classList.toggle('hidden', !wordleHelpVisible);
			}
			helpToggle.textContent = wordleHelpVisible ? 'Hide how to play' : 'Press here if you don\'t';
		});
	}
});

function buildWordleKeyboard() {
	const keyboard = document.getElementById('wordleKeyboard');
	if (!keyboard) return;
	keyboard.innerHTML = '';

	const layout = [
		['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
		['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
		['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
	];

	for (i = 0; i < layout.length; i++) {
		const row = layout[i];
		const rowEl = document.createElement('div');
		rowEl.className = 'key-row';

		if (i !== 2) {
			rowEl.classList.add('long-key-row');
		}

		for (const key of row) {
			const btn = document.createElement('button');
			btn.className = 'key';
			if (key === 'BACK') {
				btn.classList.add('key-back');
				btn.textContent = '⌫';
			} else {
				btn.textContent = key;
			}
			btn.addEventListener('click', () => handleWordleKey(key));
			rowEl.appendChild(btn);
		}

		keyboard.appendChild(rowEl);
	}
}

function handleWordleKey(key) {
	if (!wordleActive) return;
	if (key === 'BACK') {
		wordleCurrentGuess = wordleCurrentGuess.slice(0, -1);
		renderWordleState();
		return;
	}
	if (wordleCurrentGuess.length >= WORDLE_ANSWER.length) return;
	wordleCurrentGuess += key;
	renderWordleState();
}
