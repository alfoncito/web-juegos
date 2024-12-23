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

export const angle = (x, y) => {
	let a = Math.atan(y / x);

	return radToDeg(a);
};

export const radToDeg = (rad) => {
	return 180 / Math.PI * rad; 
};

export const degToRad = (deg) => {
	return Math.PI / 180 * deg;
};

export const iteratorMultiArray = (multiArray) => {
	let indexes = [0];
	
	return {
		[Symbol.iterator]() {
			return {
				next() {
					while (indexes.length > 0) {
						let item = multiArray;
						
						for (let i = 0; i < indexes.length; i++)
							item = item[indexes[i]];

						if (Array.isArray(item)) {
							indexes.push(0);
						} else if (item === undefined) {
							indexes.pop();
							if (indexes.length > 0)
								indexes[indexes.length - 1]++;
						} else {
							indexes[indexes.length - 1]++;

							return { done: false, value: item };
						}
					}

					return { done: true };
				}
			};
		}
	};
};

export const distance = (x1, y1, x2, y2) => {
	let cat1 = Math.abs(x1 - x2),
		cat2 = Math.abs(y1 - y2);

	return Math.sqrt(cat1 ** 2 + cat2 ** 2);
};
