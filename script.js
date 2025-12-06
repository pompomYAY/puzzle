const words = ['POMPOM', 'ATELIER', 'EIMBEAN', 'GENSHIN', 'CHEETO', 'MILO', 'WORD', 'GAME'];

let grid = [];
let selectedCells = [];
let foundWords = new Set();
let isDragging = false;
let isTouchDrag = false;
let lastDragKey = null;
let dragStartTime = 0;
let globalListenersBound = false;

function initializePuzzle() {
	// Create a 10x10 grid
	grid = Array(10).fill(null).map(() => Array(10).fill(''));
	selectedCells = [];
	foundWords.clear();
	
	// Place words in the grid
	placeWords();
	
	// Fill empty cells with random letters
	fillEmptyCells();
	
	// Render the puzzle
	renderGrid();
	renderWordList();
	renderWords();
}

function placeWords() {
	const directions = [
		{ dx: 1, dy: 0 },   // horizontal right
		{ dx: 0, dy: 1 },   // vertical down
		{ dx: 1, dy: 1 },   // diagonal down-right
		{ dx: -1, dy: 1 }   // diagonal down-left
	];
	
	for (const word of words) {
		let placed = false;
		let attempts = 0;
		
		while (!placed && attempts < 100) {
			const direction = directions[Math.floor(Math.random() * directions.length)];
			const row = Math.floor(Math.random() * 10);
			const col = Math.floor(Math.random() * 10);
			
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
		
		if (row < 0 || row >= 10 || col < 0 || col >= 10) {
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
	for (let i = 0; i < 10; i++) {
		for (let j = 0; j < 10; j++) {
			if (grid[i][j] === '') {
				grid[i][j] = letters[Math.floor(Math.random() * letters.length)];
			}
		}
	}
}

function renderGrid() {
	const gridElement = document.getElementById('grid');
	gridElement.innerHTML = '';
	gridElement.style.gridTemplateColumns = `repeat(10, 1fr)`;
	
	for (let i = 0; i < 10; i++) {
		for (let j = 0; j < 10; j++) {
			const cell = document.createElement('div');
			cell.className = 'cell';
			cell.textContent = grid[i][j];
			cell.dataset.row = i;
			cell.dataset.col = j;
			
			// Mouse events
			cell.addEventListener('mousedown', (e) => startDrag(i, j, cell, e));
			cell.addEventListener('mouseenter', () => dragOver(i, j, cell));
			cell.addEventListener('mouseup', () => endDrag());
			
			// Touch events
			cell.addEventListener('touchstart', (e) => startDrag(i, j, cell, e));
			cell.addEventListener('touchmove', (e) => handleTouchMove(e));
			cell.addEventListener('touchend', () => endDrag());
			
			gridElement.appendChild(cell);
		}
	}
	
	// Global mouse/touch end listeners
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
	if (cellKey === lastDragKey) return; // avoid rapid re-toggles on hover
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
	
	// Check if selected cells form a word
	const selectedText = selectedCells.map(c => grid[c.row][c.col]).join('');
	
	// Check forward and backward
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
		
		// Mark cells as found
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
	}
}
// showCompletionMessage()

window.showCompletionMessage = showCompletionMessage;

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
		
		// Check if this cell is part of any found word
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
				
				if (r < 0 || r >= 10 || c < 0 || c >= 10 || grid[r][c] !== word[i]) {
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

// Initialize the puzzle on page load
document.addEventListener('DOMContentLoaded', () => {
	initializePuzzle();
	
	// Apply wave effect to all titles
	const h1 = document.querySelector('h1');
	const h2s = document.querySelectorAll('h2');
	const waveTexts = document.querySelectorAll('.wave');
	waveTexts.forEach(el => applyWaveEffect(el));
	
	if (h1) applyWaveEffect(h1);
	h2s.forEach(h2 => applyWaveEffect(h2));
});
