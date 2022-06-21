export const collectArrays = <T>(arrays: T[][]): T[] =>
  arrays.reduce((acc, arr) => acc.concat(arr));
