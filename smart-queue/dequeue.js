// Don't think is needed but just in case.
export function dequeue(array, _item) {
  const [, ...rest] = array;
  return rest;
}