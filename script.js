const words = ['POMPOM', 'MUFFIN', 'MACAROON', 'BAGEL', 'SCONE', 'ATELIER', 'EIMBEAN', 'POKEMON', 'MILO', 'ILOVEYOU', 'DRINKWATER'];
const GRID_ROWS = 10;
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
	
	for (const word of words) {
		let placed = false;
		let attempts = 0;
		
		while (!placed && attempts < 100) {
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

let charactersClicked = 0;
let totalCharacters = 8;
const charactersToPress = 16;
let activeCharacters = [];
let animationFrameId = null;

function startCharacterClikerGame() {
	charactersClicked = 0;
	activeCharacters = [];
	if (animationFrameId) {
		cancelAnimationFrame(animationFrameId);
		animationFrameId = null;
	}

	const gameContainer = document.getElementById('charactersGame');
	if (gameContainer) gameContainer.innerHTML = '';
	
	const completionMessage = document.getElementById('completionMessage');
	const clickerSection = document.getElementById('characterClickerSection');
	
	if (completionMessage && clickerSection) {
		completionMessage.classList.add('hidden');
		clickerSection.classList.remove('hidden');
		
		// Spawn initial characters
		spawnCharacters();
		updateClickerProgress();
		startCharacterAnimationLoop();
	}
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
	if (char.dataset.clicked === 'true') return;
	
	char.dataset.clicked = 'true';
	char.classList.add('clicked');
	
	charactersClicked++;
	updateClickerProgress();
	
	// Remove character after click animation
	setTimeout(() => {
		char.remove();
		activeCharacters = activeCharacters.filter(c => c !== char);
		
		// Spawn new character to replace it
		if (charactersClicked < charactersToPress) {
			spawnCharacters();
		} else {
			completeClickerGame();
		}
	}, 300);
}

function updateClickerProgress() {
	const progress = document.getElementById('clickerProgress');
	progress.textContent = `Sent to heaven (killed): ${charactersClicked} / ${charactersToPress}`;
}

function completeClickerGame() {
	const clickerSection = document.getElementById('characterClickerSection');
	const wordleSection = document.getElementById('wordleSection');

	if (animationFrameId) {
		cancelAnimationFrame(animationFrameId);
		animationFrameId = null;
	}

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
	
	// Move to Wordle after a delay
	setTimeout(() => {
		clickerSection.classList.add('hidden');
		if (wordleSection) {
			wordleSection.classList.remove('hidden');
			startWordleGame();
		}
	}, 2000);
}

// Wordle helpers
function startWordleGame() {
	wordleActive = true;
	wordleGuesses = [];
	const grid = document.getElementById('wordleGrid');
	const message = document.getElementById('wordleMessage');
	const input = document.getElementById('wordleInput');
	if (message) message.textContent = '';
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
	if (input) {
		input.value = '';
		input.focus();
	}
}

function resetWordleGameWithMessage(text) {
	const message = document.getElementById('wordleMessage');
	if (message) message.textContent = text;
	setTimeout(() => startWordleGame(), 1300);
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
	const input = document.getElementById('wordleInput');
	const message = document.getElementById('wordleMessage');
	if (!input) return;

	const guessRaw = input.value.trim().toUpperCase();
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
		resetWordleGameWithMessage('I\'ll give you another chance :P');
		return;
	}

	input.value = '';
	if (message) message.textContent = tryAgainMessages[Math.min(wordleGuesses.length - 1, tryAgainMessages.length - 1)];
}

function renderWordleState() {
	const grid = document.getElementById('wordleGrid');
	if (!grid) return;
	const cells = grid.querySelectorAll('.wordle-cell');
	const answerArr = WORDLE_ANSWER.split('');

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
	const wordleInput = document.getElementById('wordleInput');
	if (wordleInput) {
		wordleInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') handleWordleSubmit();
		});
	}
});
