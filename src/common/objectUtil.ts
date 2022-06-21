export const mapValues = <K extends keyof any, T, TMapped>(
  o: Record<K, T>,
  mapF: (v: T) => TMapped
): Record<K, TMapped> => {
  const mappedEntries = Object.entries<T>(o).map(([name, value]) => [
    name,
    mapF(value),
  ]);
  return Object.fromEntries(mappedEntries);
};
