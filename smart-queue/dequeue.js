// Don't think is needed but just in case.
export function dequeue(array) {
  const [, ...rest] = array;
  return rest;
}
