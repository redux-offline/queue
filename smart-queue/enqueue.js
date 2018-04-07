import * as QueueActionTypes from "./action-types";

function validKey(key) {
  if (key === null) {
    console.log("Missing key, every queue action should have a key!");
    return false;
  }
  return true;
}

function indexOfAction(array, key) {
  return array.findIndex(
    ({ meta: { offline: { queue = null } } }) => queue && queue.key === key
  );
}
export function enqueue(array, action) {
  const { meta: { offline: { queue = null } } } = action;
  let index, existingAction;

  if (!queue) {
    return [...array, action];
  }

  const { method = "UNKNOWN", key = null } = queue;
  if (!validKey(key)) {
    return array;
  }

  index = indexOfAction(array, key);

  switch (method) {
    case QueueActionTypes.CREATE:
      if (index !== -1) {
        array[index] = { ...array[index], ...action };
        return array;
      }
      return [...array, action];
    case QueueActionTypes.DELETE:
      if (index !== -1) {
        existingAction = array[index];
        if (
          existingAction.meta.offline.queue.method ===
            QueueActionTypes.UPDATE ||
          existingAction.meta.offline.queue.method === QueueActionTypes.CREATE
        ) {
          array.splice(index, 1);
        }
      }
      return array;
    case QueueActionTypes.UPDATE:
      if (index !== -1) {
        existingAction = array[index];
        if (
          existingAction.meta.offline.queue.method === QueueActionTypes.CREATE
        ) {
          array[index] = { ...array[index], ...action };
        }
      }
      return array;
    case QueueActionTypes.READ:
      if (index !== -1) {
        existingAction = array[index];
        if (
          existingAction.meta.offline.queue.method === QueueActionTypes.READ
        ) {
          array[index] = { ...array[index], ...action };
        }
      } else {
        return [...array, action];
      }
      return array;
    default:
      console.log(
        'Missing method definition, the "method" value should be either of [CREATE, READ, DELETE, UPDATE], ignoring this actions!'
      );
      return array;
  }
}
