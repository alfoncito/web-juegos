import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/style.css';
import '../css/memory.css';
import Modal from 'bootstrap/js/dist/modal.js';
import {
  fisherYatesShuffle,
  swapElements,
  coinFlip,
  formatt0,
  generateUniqueId,
} from "./utils.js";

const imagesPath = {
  famosos: [
    "famoso_1.jpg",
    "famoso_2.webp",
    "famoso_3.jpg",
    "famoso_4.webp",
    "famoso_5.webp",
    "famoso_6.webp",
    "famoso_7.jpg",
    "famoso_8.jpg",
    "famoso_9.jpeg",
    "famoso_10.webp",
    "famoso_11.jpg",
    "famoso_12.jpg",
    "famoso_13.webp",
    "famoso_14.webp",
    "famoso_15.jpg",
    "famoso_16.jpg",
    "famoso_17.jpeg",
    "famoso_18.webp",
    "famoso_19.webp",
    "famoso_20.jpg",
    "famoso_21.jpg",
    "famoso_22.jpg",
    "famoso_23.webp",
    "famoso_24.webp",
    "famoso_25.jpg",
    "famoso_26.webp",
    "famoso_27.jpeg",
    "famoso_28.webp",
    "famoso_29.webp",
    "famoso_30.jpg",
    "famoso_31.webp",
    "famoso_32.jpg",
  ],
  carros: [],
  hongos: [],
  millonarios: [],
};

const startGame = () => {
  let $hand,
    timer = createTimer(document.getElementById("timer")),
    $movements = document.getElementById("trieds"),
    movements = 0,
    $remaining = document.getElementById("remaining"),
    remaining = 8,
    isBusyHand = false,
    modal = createWinModal();

  const init = () => {
    let $container = document.getElementById("memory-container"),
      searchParams = new URL(location.href).searchParams,
      dificulty = searchParams.get("dificultad"),
      images = imagesPath[searchParams.get("tematica")],
      $loader = createLoader();

    movements = 0;
    switch (dificulty) {
      case "facil":
        remaining = 8;
        $container.classList.add("row-cols-4");
        break;
      case "medio":
        remaining = 15;
        $container.classList.add("row-cols-6");
        break;
      case "dificil":
        remaining = 18;
        $container.classList.add("row-cols-6");
        break;
      default:
        break;
    }

    $container.innerHTML = "";
    $movements.textContent = movements;
    renderRemaining();
    timer.reset();
    $container.appendChild($loader);
    images = images.map(img => `/img/${img}`);
    loadCards(images, remaining).then(($cards) => {
      $loader.remove();
      $container.appendChild($cards);
      timer.start();
    });
  };

  const handleClick = (e) => {
    if (
      !isBusyHand &&
      (
      	e.target.matches(".memory-card") ||
      	e.target.matches(".memory-card *")
      )
    ) {
      let $card = e.target.closest(".memory-card");

      if ($card.classList.contains("flip")) return;

      $card.classList.add("flip");
      if ($hand) {
        addMovement();
        if ($card.dataset.id === $hand.dataset.id) {
          subtractRemaining();
          if (remaining === 0) win();
        } else {
          let $otherHand = $hand;

          isBusyHand = true;
          setTimeout(() => {
            isBusyHand = false;
            $otherHand.classList.remove("flip");
            $card.classList.remove("flip");
          }, 1500);
        }
        $hand = null;
      } else {
        $hand = $card;
      }
    }
  };

  const addMovement = () => {
    movements++;
    $movements.textContent = movements;
  };

  const renderRemaining = () => {
    $remaining.textContent = remaining;
  };

  const subtractRemaining = () => {
    remaining--;
    renderRemaining();
  };

  const win = () => {
    timer.stop();
    modal.show({
      time: timer.getTime(),
      movements,
    });
  };

  init();
  modal.onContinue(init);
  modal.onExit(() => (location.href = "/"));
  document.addEventListener("click", handleClick);
};

const createWinModal = () => {
  let $modalElm = document.getElementById("modal-win"),
    $modalBody = document.querySelector(".modal-body"),
    modal = new Modal($modalElm, { backdrop: false }),
    cbContinue,
    cbExit;

  $modalElm.addEventListener("hidden.bs.modal", () => {
    $modalBody.innerHTML = "";
  });

  $modalElm.addEventListener("click", (e) => {
    if (e.target.id === "modal-continue") cbContinue?.();
    else if (e.target.id === "modal-exit") cbExit?.();
  });

  return {
    show(data) {
      $modalBody.insertAdjacentHTML(
      	"afterbegin",
      	createModalBodyHTML(data)
      );
      modal.show();
    },
    onContinue(cb) {
      cbContinue = cb;
    },
    onExit(cb) {
      cbExit = cb;
    },
  };
};

const createModalBodyHTML = (data = {}) => {
  return `
    <img
    	class="w-75 d-block mx-auto"
    	src="../assets/img/celebracion.jpg"
    	alt="Felicidades"
    />
    <p class="text-end text-secondary">
      <small>
        <a href="https://www.freepik.es/vector-gratis/gente-feliz-bailando-fiesta-juntos-plantilla-web-dibujos-animados-emocionados-amigos-o-companeros-trabajo-celebrando-confeti_10581753.htm#query=celebracion%20logros&position=20&from_view=keyword&track=ais&uuid=d23d0f6f-d269-4ea2-a125-e2913e1870a8">
          Imagen de pch.vector
        </a> en Freepik
      </small>
    </p>
    <table class="table">
      <tbody>
        <tr>
          <td scope="row" class="fw-bold">tiempo</th>
          <td>${data.time ?? "10:00"}</td>
        </tr>
        <tr>
          <td scope="row" class="fw-bold">movimientos</td>
          <td>${data.movements ?? 8}</td>
        </tr>
      </tbody>
    </table>
    <p class="text-second text-end">¿Jugamos otra partida?</p>
  `;
};

const createLoader = () => {
  let $loader = document.createElement("div");

  $loader.classList.add(
  	"loader", "position-absolute",
  	"top-50", "start-50"
  );
  return $loader;
};

const createTimer = ($elem) => {
  let intervalId,
    time = 0;

  return {
    start() {
      intervalId = setInterval(() => {
        time++;
        $elem.textContent = `${formatt0(Math.floor(time / 60), 2)}:${formatt0(
          time % 60,
          2
        )}`;
      }, 1000);
    },
    stop() {
      clearInterval(intervalId);
      intervalId = null;
    },
    reset() {
      time = 0;
      $elem.textContent = "00:00";
    },
    getTime() {
      return $elem.textContent;
    },
  };
};

const loadCards = async (
	images,
	cardsCount,
	alt = "Una imagen"
) => {
  let paths = choiseImages(images, cardsCount),
    urls = await loadImages(paths),
    cards = [],
    $frag = document.createDocumentFragment();

  urls.forEach((url) => {
    let $memoryCard = memoryCardElement(url, alt);

    cards.push($memoryCard.cloneNode(true));
    cards.push($memoryCard);
  });
  fisherYatesShuffle(cards);
  cards.forEach((c) => $frag.appendChild(c));
  return $frag;
};

const loadImages = async (paths) => {
  let promises = paths.map((p) => fetch(p)),
    responses = await Promise.all(promises),
    imgUrls = [];

  for (let res of responses) {
    let blob = await res.blob();

    imgUrls.push(await blobToUrl(blob));
  }

  return imgUrls;
};

const blobToUrl = (blob) => {
  let reader = new FileReader();

  reader.readAsDataURL(blob);

  return new Promise((res, rej) => {
    reader.addEventListener("loadend", (e) => {
      res(e.target.result);
    });

    reader.addEventListener("error", (e) => {
      rej(e.target);
    });
  });
};

const choiseImages = (images, count) => {
  let indexes = new Array(images.length).fill(0),
    chosen = [];

  indexes.forEach((value, index) => (indexes[index] = index));
  indexes = fisherYatesShuffle(indexes);

  for (let i = 0; i < count; i++)
  	chosen[i] = `${images[indexes.pop()]}`;

  return chosen;
};

const cutAndShuffle = (arr, low, high) => {
  if (low === high) return arr;

  let mid = low + Math.floor((high - low) / 2);

  if (coinFlip()) {
    let diff = mid - low;

    for (let i = 0; i <= diff; i++)
    	swapElements(arr, low + i, high - i);
  }

  cutAndShuffle(arr, low, mid);
  cutAndShuffle(arr, mid + 1, high);
  return arr;
};

const memoryCardElement = (srcImg, alt = "") => {
  let $col = document.createElement("div");

  $col.classList.add("col", "perspective");
  $col.insertAdjacentHTML(
    "afterbegin",
    `
      <div class="memory-card position-relative rounded" data-id="${generateUniqueId()}">
        <img
          src="${srcImg}"
          alt="${alt}"
          class="rounded memory-card-side-up img-fluid"
        />
        <div class="rounded memory-card-side-down"></div>
      </div>
    `
  );

  return $col;
};

document.addEventListener("DOMContentLoaded", startGame);
