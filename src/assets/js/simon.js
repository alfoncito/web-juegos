import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/style.css';
import '../css/simon.css';
import Modal from 'bootstrap/js/dist/modal.js';
import { randBetweenInt } from "./utils.js";

const startGame = () => {
	const MAX_RECORDS = 10;
	
  let simon = createSimon(),
    score = createScore(),
    modal = createModal(modalBody),
    btnStart = createBtnStart();

  const seeSequence = async (delay) => {
    await wait(delay);
    simon.addStep();
    simon.playSequence(() => performSequence());
  };

  const performSequence = () => {
    let tryer = simon.trySequence(),
      pressing = false;

    const handleClick = async (e) => {
      if (pressing || !tryer.isBtn(e.target)) return;

      await pressBtn(e.target);

      if (!tryer.correct) {
        document.removeEventListener("click", handleClick);
        endGame();
      } else if (tryer.isDone()) {
        document.removeEventListener("click", handleClick);
        score.add();
        seeSequence(1000);
      }
    };

    const pressBtn = async ($btn) => {
      tryer.press($btn);
      pressing = true;
      await wait(350);
      tryer.depress();
      pressing = false;
    };

    document.addEventListener("click", handleClick);
  };

  const endGame = () => {
	  let logs = localStorage.getItem('simon-records') ?? '[]',
	    newLog = {
				id: uniqueId(),
				score: score.get(),
				date: Date.now(),
				alias: ''
	    },
	    maxScore = null;

		logs = JSON.parse(logs);
		maxScore = Math.max(...logs.map(l => l.score));
	  logs.push(newLog);
		logs.sort((la, lb) => lb.score - la.score);

		if (logs.length > MAX_RECORDS)
			logs.length = 10;
	  
	  localStorage.setItem('simon-records',
			JSON.stringify(logs)
	  );

		modal.show({
			logs,
			currentId: newLog.id,
			newRecord: newLog.score > maxScore,
			lastAlias: localStorage.getItem('simon-last-alias')
		});
  };

  const handleContinue = () => {
    simon.reset();
    score.reset();
    btnStart.depress();
  };

  const handleExit = () => {
    location.href = "/";
  };

  const handleClickStart = () => {
    seeSequence(300);
  };

  const handleClose = ({ alias, id }) => {
		let logs, log;

		if (!id) return;
		
		logs = localStorage.getItem('simon-records');
		logs = JSON.parse(logs);
		log = logs.find(l => l.id === id);
		log.alias = alias;

		if (alias !== '')
			localStorage.setItem('simon-last-alias', alias);

		localStorage.setItem('simon-records', 
			JSON.stringify(logs)
		);
  };

  btnStart.onclick(handleClickStart);
  modal.onContinue(handleContinue);
  modal.onExit(handleExit);
  modal.onClose(handleClose);
};

const createSimon = () => {
  let sequence = [],
    btns = [
      createSimonBtn({
        id: "green",
        onClases: ["green", "top-left-on"],
        frequencyTone: 233.082,
      }),
      createSimonBtn({
        id: "red",
        onClases: ["red", "top-right-on"],
        frequencyTone: 349.228,
      }),
      createSimonBtn({
        id: "blue",
        onClases: ["blue", "bottom-right-on"],
        frequencyTone: 466.164,
      }),
      createSimonBtn({
        id: "yellow",
        onClases: ["yellow", "bottom-left-on"],
        frequencyTone: 277.183,
      }),
    ],
    fact = 1;

  return {
    addStep() {
      let step = randBetweenInt(0, 12) % 4;

      sequence.push(step);
    },
    async playSequence(cbEnd) {
      let toneDur = fact * 500,
        toneDelay = fact * 200;

      for (let index of sequence) {
        btns[index].press();
        await wait(toneDur);
        btns[index].depress();
        await wait(toneDelay);
      }

      fact = Math.max(fact - 0.05, 0.5);
      cbEnd?.();
    },
    trySequence() {
      return createTrySequence(btns, sequence);
    },
    reset() {
      sequence.length = 0;
      fact = 1;
    },
  };
};

const createSimonBtn = (() => {
  const audioContext = new AudioContext(),
    proto = {
      _$btn: null,
      _$light: null,
      _$center: null,
      _$btnStart: null,
      _freq: null,
      _osc: null,
      _onClases: [],
      press() {
        this._osc = audioContext.createOscillator();

        this._osc.type = "triangle";
        this._osc.frequency.setValueAtTime(
          this._freq ?? 440,
          audioContext.currentTime
        );
        this._osc.connect(audioContext.destination);

        this._$btn.classList.add("on");
        this._$light.classList.remove("d-none");
        this._$center.classList.add(...this._onClases);
        this._$btnStart.classList.add(...this._onClases);
        this._osc.start();
      },
      depress() {
        this._$btn.classList.remove("on");
        this._$light.classList.add("d-none");
        this._$center.classList.remove(...this._onClases);
        this._$btnStart.classList.remove(...this._onClases);
        this._osc.stop();
        this._osc.disconnect();
      },
      matches($elem) {
        return this._$btn === $elem;
      },
    };

  return ({ id, onClases, frequencyTone }) => {
    let $btn = document.getElementById(id),
      simonBtn = Object.create(proto);

    return Object.assign(simonBtn, {
      _$btn: $btn,
      _$light: $btn.previousElementSibling,
      _$center: document.getElementById("simon-center"),
      _$btnStart: document.getElementById("simon-btn-start"),
      _onClases: onClases,
      _freq: frequencyTone,
    });
  };
})();

const createTrySequence = (btns, sequence) => {
  return {
    _i: 0,
    _btnPressed: null,
    correct: true,
    isBtn($elem) {
      return btns.some((b) => b.matches($elem));
    },
    press($elm) {
      for (let btn of btns) {
        if (btn.matches($elm)) {
          btn.press();
          this._btnPressed = btn;
          break;
        }
      }
    },
    depress() {
      if (this._btnPressed) {
        this._btnPressed.depress();
        this.correct =
          this.correct && this._btnPressed === btns[sequence[this._i]];
        this._btnPressed = null;
        this._i++;
      }
    },
    isDone() {
      return this._i >= sequence.length;
    },
  };
};

const createScore = () => {
  let $elem = document.getElementById("score"),
    score = 0;

  return {
    add() {
      score++;
      $elem.textContent = score;
    },
    reset() {
      score = 0;
      $elem.textContent = score;
    },
    get() {
      return score;
    },
  };
};

const createModal = (functBody) => {
  let $modal = document.getElementById("modal"),
    bsModal = new Modal($modal, {
      backdrop: false,
    }),
    cbContinue,
    cbExit,
    cbClose;

  $modal.addEventListener("click", (e) => {
    if (e.target.id === "modal-continue") cbContinue?.();
    else if (e.target.id === "modal-exit") cbExit?.();
  });

  $modal.addEventListener('hide.bs.modal', () => {
		let $input = document.getElementById('input-alias');

		cbClose?.({
			alias: $input?.value,
			id: $input?.dataset.id
		});
  });

  return {
    onContinue(cb) {
      cbContinue = cb;
    },
    onExit(cb) {
      cbExit = cb;
    },
    onClose(cb) {
			cbClose = cb;
    },
    show(data) {
      let $modalBody = document.querySelector(".modal-body"),
      	$input;

      $modalBody.innerHTML = "";
      $modalBody.insertAdjacentHTML("afterbegin", functBody(data));
      $input = document.getElementById('input-alias');
      
      if ($input) {
				let boundInput = $input.getBoundingClientRect(),
					$container = document.getElementById('table-container'),
					boundContainer = $container.getBoundingClientRect(),
					topRelative = boundInput.top - boundContainer.top;

				$container.scrollTo(0, topRelative);
				$input.focus();
      }
      bsModal.show();
    },
  };
};

const modalBody = (data) => {
  return `
  	${data.newRecord ? createBannerHtml() : ""}
	  <img
	    src="../assets/img/cerebro-${
	    	data.newRecord ? "feliz" : "asustado"
	    }.webp" 
	    alt="Cerebro de fin de juego" 
	    class="d-block w-50 mx-auto"
	  >
	  <p class="text-end">
      <small>
        <a 
          href="https://www.freepik.es/vector-gratis/coleccion-personajes-cerebro-humano-que-tienen-idea-creativa-bailan-regocijan-asustan_35159597.htm#fromView=search&page=1&position=36&uuid=91ccbe86-8941-4885-aad0-db2d3b66883e" 
          target="_blank"
          class="link-secondary text-decoration-none"
        >
          Imagen de pch.vector en Freepik
        </a>
      </small>
    </p>
    <div class='simon-logs-table-container' id='table-container'>
		  <table class="table" id='logs-table'>
		  	<thead class='sticky-top'>
		  		<th
		  			class='bg-body-secondary text-dark text-opacity-75'
		  		>
		  			#
		  		</th>
		  		<th
		  			class='bg-body-secondary text-dark text-opacity-75'
		  		>
		  			Alias
		  		</th>
		  		<th
		  			class='bg-body-secondary text-dark text-opacity-75'
		  		>
		  			Puntuación
		  		</th>
		  		<th
		  			class='bg-body-secondary text-dark text-opacity-75'
		  		>
		  			Fecha
		  		</th>
		  	</thead>
		    <tbody>
		      ${createTableRecords(data)}
		    </tbody>
		  </table>
		</div>
    <p class="text-prymary text-center">
    	¿Jugamos otra partida?
    </p>
  `;
};

const uniqueId = () => {
	let date = Date.now(),
		hash = Math.random().toString(36).substr(2, 9);
	
  return `id-${date}-${hash}`;
};

const createTableRecords = (data) => {
	let rows = [];
	
	data.logs.forEach((log, index) => {
		let date = new Date(log.date),
			tdClass = log.id === data.currentId ? 'bg-primary-subtle' : '',
			dateFormatted = '';

		dateFormatted += `${date.getDate()}-`;
		dateFormatted += `${date.getMonth()}-`;
		dateFormatted += `${date.getFullYear()} `;
		dateFormatted += `${date.getHours()}:`;
		dateFormatted += `${date.getMinutes()}`;
		
		rows.push(`
			<tr>
				<td class='${tdClass} fw-bold'>${index + 1}</td>
        <td class='${tdClass}'>
        	${
						log.id === data.currentId
							? `
								<input
									data-id='${log.id}'
									id='input-alias'
									type='text'
									class='form-control p-1 w-25'
									maxLength='3'
									placeholder='abc'
									value='${data.lastAlias}'
									autofocus
								/>
							`
        			: (log.alias || 'abc') 
        	}
        </td>
        <td class='${tdClass}'>${log.score}</td>
        <td class='${tdClass} text-black text-opacity-50 text-truncate'>
        	${dateFormatted}
        </td>
      </tr>
		`);
	});
	
	return rows.join('');
};

const createBannerHtml = () =>  `
  <div class="bg-primary py-2 my-2 rounded">
    <h3 class="text-white display-6 text-center fw-b">
    	¡Felicidades, nuevo record!
    </h3>
  </div>
`;

const createBtnStart = () => {
  let $btn = document.getElementById("simon-btn-start"),
    handleClick,
    pressed = false;

  $btn.addEventListener("click", () => {
    if (!pressed && handleClick) {
      $btn.classList.add("simon-btn-start__pressed");
      pressed = true;
      handleClick();
    }
  });

  return {
    depress() {
      $btn.classList.remove("simon-btn-start__pressed");
      pressed = false;
    },
    onclick(cb) {
      handleClick = cb;
    },
  };
};

const wait = (time) => {
	return new Promise((res) => setTimeout(res, time))
};

document.addEventListener("DOMContentLoaded", startGame);
