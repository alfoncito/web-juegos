import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/style.css';
import '../css/iq-gears.css';
import { angle, iteratorMultiArray } from '../js/utils.js';

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
		},
		remove() {
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
		DEG_MAP = {};

	const proto = {
		element: null,
		gears: null,
		inverted: false,
		rotation: 0,
		renderGears() {
			
		},
		turnLeft() {

		},
		turnRight() {

		},
		invert() {

		},
		resort() {

		}
	};

	return ({ gears }) => {
		let container = Object.create(proto);

		return Object.assign(container, {
			element: createGearContainerElement(),
			gears: putGears(gears),
		});
	};
})();

const putGears = (gears) => {
	let grid = [
		[null, null, null],
		[null, null, null],
		[null, null, null]
	];

	for (let g of gears)
		grid[g.row][g.col] = g.elm;
	return gears;
};

const createGearContainerElement = () => {
	let $div = document.createElement('div'),
		containerCells = [];

	for (let r = 0; r < 3; r++)
		for(let c = 0; c < 3; c++)
			containerCells.push(
				`<div id="cc-${r}:${c}"></div>`
			);

	$div.insertAdjacentHTML(
		'afterbegin',
		`
			<div class="js-gears-container" id="">
				${containerCells.join('')}
			</div>
		`
	);

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

	return ({ element, container, pos }) => {
		let gear = Object.create(proto);

		return Object.assign(gear, {
			element,
			container,
			relPos: {
				row: pos.row,
				col: pos.col
			}
		});
	};
})();

const makeNut = (() => {
	const proto = {
		cell: null,
		element: null,
		contsiner: null,
		handle() {

		},
	};

	return () => {
		let nut = Object.create(proto);

		return nut;
	};
})();

const startGame = () => {
	let geatCells = createGeatCells();
};

const createGeatCells = () => {
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

for (let n of iteratorMultiArray(['Hola',[['mundo']]]))
	console.log(n);
document.addEventListener('DOMContentLoaded', startGame);
