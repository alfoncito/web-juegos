import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.min.css';
import '../css/style.css';
import Modal from 'bootstrap/js/dist/modal.js';
import Carousel from 'bootstrap/js/dist/carousel.js';

const main = () => {
	manageMemorySelectModal();
};

const manageMemorySelectModal = () => {
	let $link = document.getElementById('memory-link'),
		$btnNext1 = document.getElementById('btn-next-1'),
		$btnNext2 = document.getElementById('btn-next-2'),
		$btnPrev = document.getElementById('btn-prev'),
		modal = new Modal('#modal-memory-select'),
		carousel = new Carousel('#carousel-memory-select', {
			interval: 0,
			keyboard: false,
			pause: true,
			touch: false
		}),
		memory = {
			type: null,
			dificulty: null
		};

	const handleNext1 = (e) => {
		if (memory.type)
			carousel.next();
	};

	const handleNext2 = (e) => {
		if (memory.dificulty) {
			let url = new URL(location.href);

			url.pathname = "/memoria/";
			url.searchParams.append(
				'dificultad',
				memory.dificulty.toLowerCase()
			);
			url.searchParams.append(
				'tematica',
				memory.type.toLowerCase()
			);

			location.href = url;
		}
	};

	const handlePrev = () => {
		carousel.prev();
		memory.type = null;
		resetSelects();
	};

	const handleBtnClick = (e) => {
		if (!e.target.matches('.js-btn-memory')) return;

		resetSelects();
		e.target.classList.add('selected');

		if (e.target.matches('[data-type]')) {
			memory.type = e.target.dataset.type;
			$btnNext1.disabled = false;
		} else {
			memory.dificulty = e.target.dataset.dificulty;
			$btnNext2.disabled = false;
		}
	};

	const resetSelects = () => {
		document
			.querySelectorAll('.js-btn-memory')
			.forEach((el) => {
				el.classList.remove('selected');
			});
		$btnNext1.disabled = true;
		$btnNext2.disabled = true;
	};

	$link.addEventListener('click', (e) => {
		e.preventDefault();
		document.addEventListener('click', handleBtnClick);
		$btnNext1.addEventListener('click', handleNext1);
		$btnNext2.addEventListener('click', handleNext2);
		$btnPrev.addEventListener('click', handlePrev);
		modal.show();
	});

	modal._element.addEventListener('hidden.bs.modal', () => {
		document.removeEventListener('click', handleBtnClick);
		$btnNext1.removeEventListener('click', handleNext1);
		$btnNext2.removeEventListener('click', handleNext2);
		$btnPrev.addEventListener('click', handlePrev);
		
		carousel.to(0);
		resetSelects();
	});
};

document.addEventListener('DOMContentLoaded', main);
