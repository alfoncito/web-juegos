const imagesPath = {
  famous: [
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
    "famoso_13.jpg",
    "famoso_14.jpg",
    "famoso_15.jpg",
    "famoso_16.jpg",
    "famoso_17.jpg",
    "famoso_18.jpg",
    "famoso_19.jpg",
    "famoso_20.jpg",
    "famoso_21.jpg",
    "famoso_22.jpg",
    "famoso_23.jpg",
    "famoso_24.jpg",
    "famoso_25.jpg",
    "famoso_26.jpg",
    "famoso_27.webp",
    "famoso_28.webp",
    "famoso_29.jpg",
  ],
  cars: [],
  mushrooms: [],
  millionaires: [],
};

const main = () => {
  loadCards();
  handlerMouse();
};

const handlerMouse = () => {
  let $hand,
    isBusyHand = false;

  const handleClick = (e) => {
    if (
      !isBusyHand &&
      (e.target.matches(".memory-card") || e.target.matches(".memory-card *"))
    ) {
      let $card = e.target.closest(".memory-card");

      if ($card.classList.contains(".memory-card")) return;

      $card.classList.add("flip");
      if ($hand) {
        if ($card.dataset.id === $hand.dataset.id) {
          console.log("Match, hurra!!!");
        } else {
          let $otherHand = $hand;

          console.log("Sorry, no hay coincidencia");
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

  document.addEventListener("click", handleClick);
};

const loadCards = () => {
  let paths = choiseImages(imagesPath.famous, 8),
    urlsRes = loadImages(paths),
    $container = document.getElementById("memory-container"),
    cards = [],
    $frag = document.createDocumentFragment();

  urlsRes.then((urls) => {
    urls.forEach((url) => {
      let $memoryCard = memoryCardElement(url, "Famoso");

      cards.push($memoryCard.cloneNode(true));
      cards.push($memoryCard);
    });
    fisherYatesShuffle(cards);
    cards.forEach((c) => $frag.appendChild(c));
    $container.appendChild($frag);
  });
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

  for (let i = 0; i < count; i++) chosen[i] = `/img/${images[indexes.pop()]}`;

  return chosen;
};

const fisherYatesShuffle = (arr) => {
  let len = arr.length;

  for (let i = len - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));

    swapElements(arr, i, j);
  }
  return arr;
};

const cutAndShuffle = (arr, low, high) => {
  if (low === high) return arr;

  let mid = low + Math.floor((high - low) / 2);

  if (coinFlip()) {
    let diff = mid - low;

    for (let i = 0; i <= diff; i++) swapElements(arr, low + i, high - i);
  }

  cutAndShuffle(arr, low, mid);
  cutAndShuffle(arr, mid + 1, high);
  return arr;
};

const coinFlip = () => Math.random() > 0.5;

const swapElements = (arr, index1, index2) => {
  if (
    index1 < 0 ||
    index1 >= arr.length ||
    index2 < 0 ||
    index2 >= arr.length
  ) {
    console.error(
      "Índices no válidos. Ambos índices deben estar dentro de los límites del array."
    );
    return;
  }

  [arr[index1], arr[index2]] = [arr[index2], arr[index1]];
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

const generateUniqueId = () => {
  const timestamp = Date.now().toString(36),
    randomNumber = Math.floor(Math.random() * 1000000001);

  return timestamp + "_" + randomNumber;
};

document.addEventListener("DOMContentLoaded", main);
