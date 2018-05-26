// Don't think is needed but just in case.
export function dequeue(array, _item, context) {
  const [, ...rest] = array;
  return rest;
}