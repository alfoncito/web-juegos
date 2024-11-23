import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/style.css';
import '../css/iq-gears.css';
import 'bootstrap-icons/font/bootstrap-icons.min.css';
import {
	angle,
	iteratorMultiArray,
	generateUniqueId,
	degToRad,
	distance
} from '../js/utils.js';
import { gsap } from 'gsap';

const CELL_CHECK_PATH = {
	['0:0']: ['up', 'left'],
	['0:1']: ['up'],
	['0:2']: ['up', 'right'],
	['1:0']: ['left'],
	['1:1']: [],
	['1:2']: ['right'],
	['2:0']: ['down', 'left'],
	['2:1']: ['down'],
	['2:2']: ['down', 'right']	
};

const startGame = () => {
	let gearCells = createGearCells(),
		gearPieces = createPiecesBoard(),
		currentGearPiece = null;

	const handleMouseDown = (e) => {
		if (
			e.target.matches('.cell:has(.gear)') ||
			e.target.matches('.cell .gear')
		) {
			takeAwayPiece(e);
			return;
		}
		
		for (let gp of gearPieces) {
			if (!gp.isChild(e.target)) continue;
			if (gp.ignoreMouseDown(e)) break;

			if (currentGearPiece)
				restoreGearPieces();

			currentGearPiece = gp;
			currentGearPiece.element.remove();
			document.body.appendChild(
				currentGearPiece.element
			);

			currentGearPiece.onMouseDown(e);
			break;
		}
	};

	const handleMouseMove = (e) => {
		currentGearPiece?.onMove(e);
	}

	const handleMouseUp = (e) => {
		if (!currentGearPiece) return;
		
		currentGearPiece.onMouseUp(e);
		if (isInGearsPiecesZone(e))
			restoreGearPieces();
		else if (canInsertPieces())
			insertPieces();
	}

	const handleClick = (e) => {
		if (!currentGearPiece) return;
		if (currentGearPiece.isChild(e.target))
			currentGearPiece.onClick(e);
		else
			restoreGearPieces();
	};

	const takeAwayPiece = (e) => {
		let cellElement = e.target.closest('.cell'),
			cell = findCellByElement(cellElement),
			gearsContainer = cell.gear.container,
			[row, col] = gearsContainer.getPositionByGear(cell.gear),
			cellBound = cellElement.getBoundingClientRect();

		gearsContainer.restore(
			e,
			Math.abs(e.clientX - cellBound.x) + col * 100,
			Math.abs(e.clientY - cellBound.y) + row * 100
		);
		currentGearPiece = gearsContainer;
		document.body.appendChild(
			currentGearPiece.element
		);
	};

	const findCellByElement = (element) => {
		for (let cell of gearCells)
			if (cell.element === element)
				return cell;

		return null;
	};

	const restoreGearPieces = () => {
		// Temporalmente a el primer espacio vacio
		let targets = document.querySelectorAll(
			'.js-gears-piece-target'
		);
		
		currentGearPiece.element.remove();
		currentGearPiece.release();
		for (let $target of targets) {
			if (!$target.hasChildNodes()) {
				$target.appendChild(
					currentGearPiece.element
				);
				break;
			}
		}
		currentGearPiece = null;
	};
	
	const displayGearPieces = () => {
		document.querySelectorAll('.js-gears-piece-target')
			.forEach((gp, index) => {
				gp.appendChild(
					gearPieces[index].element
				);
			});
	};

	const isInGearsPiecesZone = (e) => {
		let bound = document
			.getElementById('gears-pieces-container')
			.getBoundingClientRect();

		return (
			e.clientX >= bound.x &&
			e.clientX <= bound.x + bound.width &&
			e.clientY >= bound.y &&
			e.clientY <= bound.y + bound.height
		);
	};

	const insertPieces = () => {
		let mainCell = getNearCell();

		currentGearPiece.clear();
		currentGearPiece.each((gear, row, col) => {
			let pathAtt = `${row}:${col}`,
				path = CELL_CHECK_PATH[pathAtt],
				cell = mainCell;

			path.forEach((p) => {
				cell = cell.siblings[p];
			});
			cell.insert(gear);
		});
		currentGearPiece = null;
	};

	const canInsertPieces = () => {
		let mainCell = getNearCell(),
			gears;

		if (!mainCell) return false;

		gears = currentGearPiece.eachGenerator();
		for (let [gear, row, col] of gears) {
			let pathAtt = `${row}:${col}`,
				path = CELL_CHECK_PATH[pathAtt],
				cell = mainCell;

				for (let p of path)
					cell = cell?.siblings[p];

				if (!cell || !cell.isEmpty)
					return false;
		}
		return true;
	};

	const getNearCell = () => {
		let boundCenter = currentGearPiece
				.elementCenter.getBoundingClientRect(),
			nearCell = null,
			shortDistance = Infinity;

		for (let cell of gearCells) {
			let boundCell = cell.element.getBoundingClientRect(),
				currDistance = distance(
					boundCenter.x,
					boundCenter.y,
					boundCell.x,
					boundCell.y
				);

			if (currDistance < shortDistance && currDistance < 30) {
				shortDistance = currDistance;
				nearCell = cell;
			}
		}

		return nearCell;
	};

	displayGearPieces();
	document.addEventListener('mousedown', handleMouseDown);
	document.addEventListener('mousemove', handleMouseMove);
	document.addEventListener('mouseup', handleMouseUp);
	document.addEventListener('click', handleClick);
};

const makeCell = (() => {
	const proto = {
		id: '',
		siblings: {
			up: null,
			down: null,
			left: null,
			right: null
		},
		gear: null,
		element: null,
		lastTranferenceCell: null,
		get isEmpty() {
			return this.gear === null;
		},
		transfer(cell, ...args) {
			this.lastTranferenceCell = cell; 
			if (this.gear)
				this.gear.handle(...args);
		},
		transference(...args) {
			for (let sbDir of Object.Keys(this.sibligns))
				if (this.siblings[sbDir] !== this.lastTranferenceCell)
					this.siblings[sbDir]?.transfer(this, ...args);
		},
		insert(gear) {
			this.gear = gear;
			gear.cell = this;
			this.element.appendChild(gear.element);
		},
		remove() {
			this.element.removeChild(this.gear.element);
			this.gear.cell = null;
			this.gear = null;
		}
	};

	return ({ id, elmId }) => {
		let cell = Object.create(proto);

		return Object.assign(cell, {
			id,
			element: document.getElementById(elmId),
			siblings: {}
		});
	};
})();

const makeGearsContainer = (() => {
	const CENTER = { x: 1, y: 1 }, 
		// fila:columna
		cellsPointer = [
			['0:2', '1:2', '2:2'],
			['0:1', '1:1', '2:1'],
			['0:0', '1:0', '2:0']
		];

	const proto = {
		element: null,
		gears: null,
		inverted: false,
		rotation: 0,
		prefix: null,
		moving: false,
		elmentCenter: null,
		offset: {
			x: 150,
			y: 150
		},
		add(gear) {
			let row = gear.relPos.row,
				col = gear.relPos.col;
				
			this.gears[row][col] = gear;
			gear.container = this;
			this.renderGears();
		},
		turnLeft() {
			this.addTurn(this.inverted ? 90 : -90);
		},
		turnRight() {
			this.addTurn(this.inverted ? -90 : 90);
		},
		addTurn(turn) {
			this.rotation += turn;
			if (this.rotation < 0)
				this.rotation += 360;
			this.rotation %= 360;
			this.resort();
		},
		invert() {
			this.inverted = !this.inverted;
			this.resort();
		},
		resort() {
			let tempGears = [],
				steps = this.rotation / 90;

			this.each((g, row, col) => {
				tempGears.push(g);
				this.gears[row][col] = null;
			});

			tempGears.forEach(g => {
				let [row, col] = this.gearPosition(g, steps);

				this.gears[row][col] = g;
			});

			this.renderGears();
		},
		getPositionByGear(gear) {
			return this.gearPosition(gear, this.rotate / 90);
		},
		gearPosition(gear, steps) {
			let row = gear.relPos.row,
				col = gear.relPos.col;
				
			for (let i = 0; i < steps; i++) {
				let [pRow, pCol] = cellsPointer[row][col].split(':');

				row = parseInt(pRow);
				col = parseInt(pCol);
			}
			if (this.inverted) col = 2 - col;
			return [row, col];
		},
		renderGears() {
			for (let g of iteratorMultiArray(this.gears))
				if (g) g.element.remove();

			for (let r = 0; r < 3; r++) {
				for (let c = 0; c < 3; c++) {
					let g = this.gears[r][c];

					if (g) {
						let selector = `#${this.id}-cc-${r}${c}`,
							$target = this.element.querySelector(selector);

						$target.appendChild(g.element);
					}
				}
			}
		},
		isChild(elm) {
			let parent = elm.closest(`#${this.id}`);

			return parent !== null;
		},
		clear() {
			this.each((gear) => {
				gear.element.remove();
			});
			this.element.remove();
		},
		each(cb) {
			for (let r = 0; r < 3; r++)
				for (let c = 0; c < 3; c++)
					if (this.gears[r][c])
						cb(this.gears[r][c], r, c);
		},
		*eachGenerator() {
			for (let r = 0; r < 3; r++)
				for (let c = 0; c < 3; c++)
					if (this.gears[r][c])
						yield [this.gears[r][c], r, c];
		},
		restore(e, offsetX, offsetY) {
			this.each(g => g.cell.remove());
			this.renderGears();
			this.offset.x = offsetX;
			this.offset.y = offsetY;
			this.moving = true;
			this.move(e.clientX, e.clientY);
		},
		ignoreMouseDown(e) {
			return e.target.matches('.btn') ||
				e.target.matches('.btn *'); 
		},
		onMouseDown(e) {
			this.moving = true;
			this.element.classList.add('selected');
			this.offset.x = 150;
			this.offset.y = 150;
			gsap.set(this.element, {
				position: 'fixed',
				cursor: 'grabbing',
				width: 300,
				height: 300,
				top: 0,
				left: 0
			});
			this.move(e.clientX, e.clientY);
		},
		release() {
			this.moving = false;
			this.element.classList.remove('selected');
			gsap.set(this.element, {
				position: 'relative',
				cursor: 'grab',
				width: 'auto',
				height: 'auto',
				x: 0,
				y: 0
			});	
		},
		onMove(e) {
			if (!this.moving) return;

			this.move(e.clientX, e.clientY);
		},
		onClick(e) {
			if (
				e.target.matches('.btn-turn-left') ||
				e.target.matches('.btn-turn-left *')
			)
				this.turnLeft();
			else if (
				e.target.matches('.btn-turn-right') ||
				e.target.matches('.btn-turn-right *')
			)
				this.turnRight();
			else if (
				e.target.matches('.btn-invert') ||
				e.target.matches('.btn-invert *')
			)
				this.invert();
				
		},
		onMouseUp() {
			this.moving = false;
		},
		move(x, y) {
			gsap.set(this.element, { 
				x: x - this.offset.x,
				y: y - this.offset.y
			});
		}
	};

	return () => {
		let container = Object.create(proto),
			id = generateUniqueId(),
			element = createGearContainerElement(id, (row, col) => {
				return  `${id}-cc-${row}${col}`;
			});

		return Object.assign(container, {
			element,
			elementCenter: element.querySelector(`#${id}-cc-11`),
			id,
			gears: [
				[null, null, null],
				[null, null, null],
				[null, null, null]
			],
			offset: {
				x: 150,
				y: 150
			}
		});
	};
})();

const createGearContainerElement = (id, generateChildId) => {
	let $div = document.createElement('div'),
		containerCells = [];

	for (let r = 0; r < 3; r++)
		for(let c = 0; c < 3; c++)
			containerCells.push(
				`<div
					id="${generateChildId(r, c)}"
					class="gear-cell p-1 border"
				></div>`
			);
	
	$div.setAttribute('id', id);
	$div.classList.add('gears-container', 'p-1', 'border');

	$div.insertAdjacentElement(
		'beforeend',
		createGearsControl()
	);
	$div.insertAdjacentHTML(
		'beforeend',
		`
			<div class="js-gears-container gears-container__pieces">
				${containerCells.join('')}
			</div>
		`
	);

	return $div;
};

const createGearsControl = () => {
	let $div = document.createElement('div');

	$div.classList.add('gears-container__controls');
	$div.innerHTML = `
		<button type="button" class="btn-turn-left btn">
			<i class="bi bi-arrow-counterclockwise"></i>
		</button>
		<button type="button" class="btn-turn-right btn">
			<i class="bi bi-arrow-clockwise"></i>
		</button>
		<button type="button" class="btn-invert btn">
			<i class="bi bi-arrows"></i>
		</button>
	`;
	
	return $div;
};

const makeGear = (() => {
	const proto = {
		cell: null,
		rotation: 0,
		inverted: false,
		element: null,
		container: null,
		relPos: {
			row: null,
			col: null
		},		
		handle() {
		
		},
	};

	return ({ pos }) => {
		let gear = Object.create(proto);

		return Object.assign(gear, {
			element: createGearElement(),
			relPos: {
				row: pos.row,
				col: pos.col
			}
		});
	};
})();

const createGearElement = () => {
	let $div = document.createElement('div');

	$div.textContent = 'E';
	$div.classList.add('gear');
	return $div;
};

const makeNut = (() => {
	const proto = {
		cell: null,
		element: null,
		container: null,
		handle() {

		},
	};

	return ({ pos }) => {
		let nut = Object.create(proto);

		return Object.assign(nut, {
			element: createNutElement(),
			relPos: {
				row: pos.row,
				col: pos.col
			}
		});
	};
})();

const createNutElement = () => {
	let $div = document.createElement('div');

	$div.textContent = 'N';
	$div.classList.add('gear');
	return $div;
};

const createGearCells = () => {
	let cells = [];

	for (let i = 0; i < 25; i++) {
		cells.push(makeCell({
			id: i,
			elmId: `gear-cell-${i}`
		}));
	}

	return connectCells(cells);
};

const connectCells = (cells) => {
	cells.forEach(cell => {
		let id = cell.id,
			sbIds = {
				left: (id % 5 !== 0) ? id - 1 : null,
				right: ((id + 1) % 5 !== 0) ? id + 1 : null,
				up: id - 5,
				down: id + 5
			};
			
		for (let [key, sbId] of Object.entries(sbIds)) {
			let sbCell = cells.find(c => c.id === sbId);

			if (sbCell)
				cell.siblings[key] = sbCell;
		}
	});

	return cells;
};

const createPiecesBoard = () => {
	/*
		g -> engranage
		n -> tuerca
		. -> nada
	*/

	const gearsMap = [
		[
			['.', '.', '.'],
			['n', 'g', '.'],
			['.', 'n', '.']
		],
		[
			['.', '.', '.'],
			['g', 'n', '.'],
			['.', 'g', '.']
		],
		[
			['.', '.', '.'],
			['.', 'g', 'n'],
			['g', 'n', '.']
		],
		[
			['.', 'n', '.'],
			['.', 'g', '.'],
			['.', 'g', '.']
		],
		[
			['.', 'g', '.'],
			['n', 'n', 'n'],
			['.', '.', '.']
		],
		[
			['.', 'n', '.'],
			['g', 'g', 'g'],
			['.', '.', '.']
		],
		[
			['.', '.', 'g'],
			['g', 'g', 'n'],
			['.', '.', '.']
		]
	];

	let pieces = [];

	for (let gearChars of gearsMap) {
		const gearFactory = makeGearFactory();

		for (let r = 0; r < 3; r++) {
			for (let c = 0; c < 3; c++) {
				let gearCode = gearChars[r][c];

				if (gearCode !== '.')
					gearFactory.add(gearCode, r, c);
			}
		}

		pieces.push(gearFactory.build());
	}
	
	return pieces;
};

const makeGearFactory = () => {
	let container = makeGearsContainer();

	return {
		add(gearCode, row, col) {
			let gear;

			if (gearCode === 'g')
				gear = makeGear({
					pos: { row, col }
				});
			else if (gearCode === 'n')
				gear = makeNut({
					pos: { row, col }
				});
			else
				throw new Error(
					`Codigo de pieza "${gearCode}" invalido.`
				);

			container.add(gear);
		},
		build() {
			return container;
		}
	};
};

document.addEventListener('DOMContentLoaded', startGame);
