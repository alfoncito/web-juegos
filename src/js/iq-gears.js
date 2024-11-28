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
import levels from './iq-levels.js';

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
	let game = {
		gearBoard: makeGameBoard(),
		gearsPieces: createPiecesBoard(),
		currPiece: null,
		beginCell:  makeBeginCell('gear-cell-begin'),
		endCell: makeEndCell('gear-cell-end'),
		_states: {},
		_currState: '',
		addState(name, state) {
			this._states[name] = state;
		},
		changeState(name) {
			if (!this._states.hasOwnProperty(name))
				throw new Error(`El estado '${name}' no existe`);
				
			this._states[this._currState]?.destroy();
			this._currState = name;
			this._states[this._currState].init();
		}
	};

	game.gearBoard.connectCell(
		game.beginCell,
		9,
		'left',
		'right'
	);
	game.gearBoard.connectCell(
		game.endCell,
		21,
		'up',
		'down'
	);
	
	game.addState('play', playState(game));
	game.addState('try', tryState(game));
	game.addState('nextLevel', nextLevelState(game));
	game.changeState('nextLevel');
};

const playState = (game) => {
	const init = () => {
		document.addEventListener('mousedown', handleMouseDown);
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
		document.addEventListener('click', handleClick);

		game.beginCell.onPlay = onPlay;
	};

	const destroy = () => {
		document.removeEventListener('mousedown', handleMouseDown);
		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);
		document.removeEventListener('click', handleClick);

		game.beginCell.onPlay = null;
	};

	const onPlay = (cancel) => {
		if (!game.gearBoard.isFull()) {
			cancel()
			console.log('Faltan piezas');
		} else
			game.changeState('try');
	};

	const handleMouseDown = (e) => {
		if (
			e.target.matches('.cell:has(.gear)') ||
			e.target.matches('.cell .gear')
		) {
			let cellElement = e.target.closest('.cell'),
				cell = game.gearBoard.findCellByElement(cellElement),
				piece = cell.gear.container;

			if (!game.gearBoard.isFixed(piece))
				takeAwayPiece({
					piece,
					cellTaked: cell,
					x: e.clientX,
					y: e.clientY
				});
		} else {
			takePiece(e);
		}
	};

	const handleMouseMove = (e) => {
		game.currPiece?.onMove(e);
	};

	const handleMouseUp = (e) => {
		if (!game.currPiece) return;
		
		game.currPiece.onMouseUp(e);
		if (isInGearsPiecesZone(e))
			restoreGearPiece();
		else if (canInsertPiece())
			insertPiece();
	};

	const handleClick = (e) => {
		if (!game.currPiece) return;
		if (game.currPiece.isChild(e.target))
			game.currPiece.onClick(e);
		else
			restoreGearPiece();
	};

	const takePiece = (e) => {
		for (let gp of game.gearsPieces) {
			if (!gp.isChild(e.target)) continue;
			if (gp.ignoreMouseDown(e)) break;

			if (game.currPiece)
				restoreGearPiece();

			game.currPiece = gp;
			game.currPiece.element.remove();
			document.body.appendChild(
				game.currPiece.element
			);

			game.currPiece.onMouseDown(e);
			break;
		}
	};

	const takeAwayPiece = ({ x, y, piece, cellTaked }) => {
		let [row, col] = piece.getPositionByGear(cellTaked.gear),
			cellBound = cellTaked.element.getBoundingClientRect();

		game.gearBoard.removePiece(piece);
		piece.restore({
			x,
			y,
			offsetX: (x - cellBound.x) + col * 100,
			offsetY: (y - cellBound.y) + row * 100
		});
		game.currPiece = piece;
		document.body.appendChild(
			game.currPiece.element
		);
	};

	const restoreGearPiece = () => {
		// Temporalmente a el primer espacio vacio
		let targets = document.querySelectorAll(
			'.js-gears-piece-target'
		);
		
		game.currPiece.element.remove();
		game.currPiece.release();
		for (let $target of targets) {
			if (!$target.hasChildNodes()) {
				$target.appendChild(
					game.currPiece.element
				);
				break;
			}
		}
		game.currPiece = null;
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

	const insertPiece = () => {
		let refCell = game.gearBoard.getNearCellByElement(
			game.currPiece.elementCenter
		);

		game.gearBoard.insertPiece(
			refCell,
			game.currPiece
		);
		game.currPiece = null;
	};

	const canInsertPiece = () => {
		let refCell = game.gearBoard.getNearCellByElement(
			game.currPiece.elementCenter
		);
		
		return game.gearBoard.canInsertPiece(
			refCell,
			game.currPiece
		);
	};
	
	return { init, destroy };
};

const tryState = (game) => {
	let win = false;
	
	const init = () => {
		console.log('Iniciando prueba');
		game.beginCell.onPause = onPause;
		game.endCell.onWin = onWin;
	};

	const destroy = () => {
		game.beginCell.onPause = null;
		game.endCell.onWin = onWin;
		win = false;
	};

	const onPause = (cancel) => {
		console.log('Vamos de regreso');
		if (!win)
			game.changeState('play');
		else
			cancel();
	};

	const onWin = () => {
		console.log('Bien hecho');
		win = true;
		setTimeout(() => {
			game.beginCell.pause();
			game.endCell.reset();
			game.changeState('nextLevel');
		}, 3000);
	};

	return { init, destroy };
};

const nextLevelState = (game) => {
	let level = -1;
	
	const init = () => {
		game.currPiece = null;
		game.beginCell.disable = true;
		game.gearBoard.clear();
		level++;
		
		fixPieces();
		displayGearPieces();

		game.changeState('play');
	};

	const destroy = () => {
		game.beginCell.disable = false;
	};

	const fixPieces = () => {
		let levelPositions = levels[level];

		levelPositions.forEach(lp => {
			let [pieceId, position, rotate, inverted] = lp.split('|'),
				piece = game.gearsPieces.find(p => p.id === pieceId);

			if (!piece)
				throw new Error(`Id de pieza ${pieceId} no encontrado`);

			piece.set({
				rotation: parseInt(rotate),
				inverted: inverted === 'true'
			});
			game.gearBoard.fixPiece(piece, parseInt(position));
		});
	};

	const displayGearPieces = () => {
		let targets = document
				.querySelectorAll('.js-gears-piece-target'),
			i = 0;

		for (let gp of game.gearsPieces) {
			if (game.gearBoard.isFixed(gp)) continue;
			
			targets[i].appendChild(gp.element);
			i++;
		}
	};

	return { init, destroy };
};

const makeGameBoard = () => {
	return {
		_cells: createGearCells(),
		_pieces: [],
		_fixedPieces: [],
		connectCell(cell, cellId, sibFrom, sibDest) {
			let innerCell = this._cells.find(c => c.id === cellId);

			if (!innerCell)
				throw new Error(`Id '${cellId}' de celda invalido.`);

			cell.siblings[sibFrom] = innerCell;
			innerCell.siblings[sibDest] = cell;
		},
		findCellByElement(element) {
			for (let cell of this._cells)
				if (cell.element === element)
					return cell;

			return null;
		},
		canInsertPiece(refCell, piece) {
			if (!refCell) return false;

			for (let [gear, row, col] of piece.eachGenerator()) {
				let pathAtt = `${row}:${col}`,
					path = CELL_CHECK_PATH[pathAtt],
					cell = refCell;

					for (let p of path)
						cell = cell?.siblings[p];

					if (!cell || !cell.isEmpty())
						return false;
			}
			return true;
		},
		insertPiece(refCell, piece) {
			piece.clear();
			piece.each((gear, row, col) => {
				let pathAtt = `${row}:${col}`,
					path = CELL_CHECK_PATH[pathAtt],
					cell = refCell;

				for(let p of path)
					cell = cell.siblings[p];
				if (!cell || !cell.isEmpty())
					throw new Error(`La posicion de la pieza '${piece.id}' es invalida`);
				cell.insert(gear);
			});
			this._pieces.push(piece);
		},
		removePiece(piece) {
			let index = this._pieces.findIndex(p => p === piece);

			if (index !== -1)
				this._pieces.splice(index, 1);
		},
		getNearCellByElement(element) {
			let boundCenter = element.getBoundingClientRect(),
				shortDistance = Infinity,
				nearCell;

			for (let cell of this._cells) {
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
		},
		clear() {
			this._pieces.forEach(p => p.clear());
			this._pieces.length = 0;
			this._fixedPieces.length = 0;
		},
		fixPiece(piece, position) {
			let cell = this._cells.find(p => p.id === position);

			if (!cell)
				throw new Error(`Posicion ${position} invalida.`);
			this._fixedPieces.push(piece);
			this.insertPiece(cell, piece);
		},
		isFixed(piece) {
			return this._fixedPieces.includes(piece);
		},
		isFull() {				
			return this._pieces.length === 7;
		}
	};
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
		trail: '',
		isEmpty() {
			return this.gear === null;
		},
		transference(...args) {
			this.transferenceWithTrail(this.trail, ...args);
		},
		transfer(trail, ...args) {
			if (this.trail !== trail && this.gear) {
				this.trail = trail;
				this.gear.handle(...args);
			}
		},
		transferenceWithTrail(trail, ...args) {
			for (let sbDir of Object.keys(this.siblings))
				this.siblings[sbDir].transfer(trail, ...args);
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

const makeBeginCell = (elmId) => {
	let beginCell = Object.create(
			makeCell({ id: 'begin', elmId })
		),
		btn = beginCell.element.querySelector('button');

	Object.assign(beginCell, {
		tween: null,
		value: 0,
		onPlay: null,
		onPause: null,
		disable: false,
		isEmpty() {
			return false;
		},
		handleClick() {
			let aborted = false;

			if (this.disable) return;
			
			const cancel = () => {
				aborted = true;
			};
			
			if (this.tween.paused()) {
				this.onPlay?.(cancel);
				if (!aborted) this.tween.play(0);
			} else {
				this.onPause?.(cancel);
				if (!aborted) {
					this.tween.pause();
					this.transferenceWithTrail(Symbol(), 0);
				}
			}
		},
		pause() {
			console.log('Pausando');
			this.tween.pause(0, false);
		},
		animate() {
			this.tween = gsap.to(this, {
				value: 360,
				repeat: -1,
				duration: 5,
				callbackScope: this,
				onUpdate: this.handleUpdate,
				ease: 'none',
				paused: true
			});
		},
		handleUpdate() {
			let trail = Symbol('trail');

			this.transferenceWithTrail(trail, this.value);
		}
	});

	btn.addEventListener(
		'click',
		beginCell.handleClick.bind(beginCell)
	);
	beginCell.animate();

	return beginCell;
};

const makeEndCell = (elmId) => {
	let endCell = Object.create(makeCell(
		{ id: 'end', elmId }
	));

	Object.assign(endCell, {
		onWin: null,
		count: 0,
		limit: 30 * 3,
		isEmpty() {
			return false;
		},
		transfer() {
			this.count++;
			if (this.count === this.limit)
				this.onWin?.();
		},
		reset() {
			this.count = 0;
		}
	});
	
	return endCell;
};

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
		set({ rotation, inverted }) {
			if (rotation !== null && rotation % 90 !== 0)
				throw new Error(`La rotacion solo puede un numero multiplo de 90, ${rotation} dado.`);

			this.rotation = rotation ?? this.rotation;
			this.inverted = inverted ?? this.inverted;
			this.resort();
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
			this.renderGears()
		},
		invert() {
			this.inverted = !this.inverted;
			this.resort();
			this.renderGears();
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
				gear.cell?.remove();
			});

			this.release();
			this.renderGears();
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
		restore({ x, y, offsetX, offsetY }) {
			this.each(g => g.cell.remove());
			this.renderGears();
			this.offset.x = offsetX;
			this.offset.y = offsetY;
			this.moving = true;
			this.element.classList.add('selected');
			gsap.set(this.element, {
				position: 'fixed',
				cursor: 'grabbing',
				width: 300,
				height: 300,
				top: 0,
				left: 0
			});
			this.move(x, y);
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

	return (id) => {
		let container = Object.create(proto),
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
		handle(value) {
			gsap.set(this.element, { rotation: value });
			this.cell.transference(value * -1);
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

	for (let i = 0; i < 25; i++)
		cells.push(makeCell({
			id: i,
			elmId: `gear-cell-${i}`
		}));

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

	const gearsId = [
		'purple', 'pink', 'red', 'orange',
		'blue', 'yellow', 'green'
	];
	const gearsMap = [
		[ // purple 
			['.', '.', '.'],
			['n', 'g', '.'],
			['.', 'n', '.']
		],
		[	// pink
			['.', '.', '.'],
			['g', 'n', '.'],
			['.', 'g', '.']
		],
		[	// red
			['.', '.', '.'],
			['.', 'g', 'n'],
			['g', 'n', '.']
		],
		[	// orange
			['.', '.', '.'],
			['n', 'g', 'g'],
			['.', '.', '.']
		],
		[	// blue
			['.', 'g', '.'],
			['n', 'n', 'n'],
			['.', '.', '.']
		],
		[	// yellow
			['.', 'n', '.'],
			['g', 'g', 'g'],
			['.', '.', '.']
		],
		[	// green
			['.', '.', 'g'],
			['g', 'g', 'n'],
			['.', '.', '.']
		]
	];

	let pieces = [];

	gearsMap.forEach((gearChars, i) => {
		const gearFactory = makeGearFactory(gearsId[i]);

		for (let r = 0; r < 3; r++) {
			for (let c = 0; c < 3; c++) {
				let gearCode = gearChars[r][c];

				if (gearCode !== '.')
					gearFactory.add(gearCode, r, c);
			}
		}

		pieces.push(gearFactory.build());
	});
	
	return pieces;
};

const makeGearFactory = (id) => {
	let container = makeGearsContainer(id);

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
