export const asSingletonArray = <T>(item: T): T[] => [item];

export const collectArrays = <T>(arrays: T[][]): T[] =>
  arrays.reduce((acc, arr) => acc.concat(arr));
