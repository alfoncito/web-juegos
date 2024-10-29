import { randBetweenInt } from "./utils.js";

const main = () => {
  startGame();
};

const startGame = () => {
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
        modal.show({
          score: score.get(),
        });
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

  btnStart.onclick(handleClickStart);
  modal.onContinue(handleContinue);
  modal.onExit(handleExit);
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
    bsModal = new bootstrap.Modal($modal, {
      backdrop: false,
    }),
    cbContinue,
    cbExit;

  $modal.addEventListener("click", (e) => {
    if (e.target.id === "modal-continue") cbContinue?.();
    else if (e.target.id === "modal-exit") cbExit?.();
  });

  return {
    onContinue(cb) {
      cbContinue = cb;
    },
    onExit(cb) {
      cbExit = cb;
    },
    show(data) {
      let $modalBody = document.querySelector(".modal-body");

      $modalBody.innerHTML = "";
      $modalBody.insertAdjacentHTML("afterbegin", functBody(data ?? {}));
      bsModal.show();
    },
  };
};

const modalBody = (data) => {
  let record = localStorage.getItem("simon-record") ?? 0,
    bannerHtml = `
      <div class="bg-primary py-2 my-2 rounded">
        <h3 class="text-white display-6 text-center fw-b">¡Felicidades, nuevo record!</h3>
      </div>
    `;

  localStorage.setItem("simon-record", Math.max(data.score, record));
  return `
  <img 
    src="img/cerebro-asustado.webp" 
    alt="Cerebro asustado" 
    class="d-block w-75 mx-auto"
  >
  <p class="text-end">
      <small>
        <a 
          href="https://www.freepik.es/vector-gratis/coleccion-personajes-cerebro-humano-que-tienen-idea-creativa-bailan-regocijan-asustan_35159597.htm#fromView=search&page=1&position=36&uuid=91ccbe86-8941-4885-aad0-db2d3b66883e" 
          target="_blank"
          class="link-secondary"
        >
          Imagen de pch.vector en Freepik
        </a>
      </small>
    </p>
  ${data.score > record ? bannerHtml : ""}
  <table class="table">
    <tbody>
      <tr>
        <td scope="row" class="fw-bold">Puntuación</th>
        <td>${data.score ?? "0"}</td>
      </tr>
    </tbody>
  </table>
    <p class="text-prymary text-end">¿Jugamos otra partida?</p>
  `;
};

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

const wait = (time) => new Promise((res) => setTimeout(res, time));

document.addEventListener("DOMContentLoaded", main);
