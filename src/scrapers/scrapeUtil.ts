import { Parse } from '../scraper';

export const readAfter = (s: string, search: string): string => {
  const index = s.indexOf(search);
  return index >= 0 ? s.substring(index + search.length) : '';
};

export const tryParseInt: Parse<number> = (s) => {
  const numOrNan = parseInt(s);
  return Number.isNaN(numOrNan) ? null : numOrNan;
};

export const nullIfAnyNull = <T>(
  items: (T | null | undefined)[]
): T[] | null => {
  if (items.length === 0) return [];
  else {
    const head = items[0];
    if (head === null || head === undefined) return null;
    else {
      const tail = nullIfAnyNull(items.slice(1));
      if (tail === null) return null;
      else return [head, ...tail];
    }
  }
};
