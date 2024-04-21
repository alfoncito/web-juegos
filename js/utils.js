export const fisherYatesShuffle = (arr) => {
  let len = arr.length;

  for (let i = len - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));

    swapElements(arr, i, j);
  }
  return arr;
};

export const swapElements = (arr, index1, index2) => {
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

export const coinFlip = () => Math.random() > 0.5;

export const formatt0 = (num, zeros) => {
  return `${"0".repeat(zeros)}${num.toString().replace("-", "")}`.slice(-zeros);
};

export const generateUniqueId = () => {
  const timestamp = Date.now().toString(36),
    randomNumber = Math.floor(Math.random() * 1000000001);

  return timestamp + "_" + randomNumber;
};

export const randBetweenInt = (min, max) => {
  return Math.round(min + (max - min) * Math.random());
};
