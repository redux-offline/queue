import { CREATE, UPDATE, DELETE, READ } from "./action-types";

function validate(key, method) {
  if (key === null) {
    throw 'Missing key, every queue action should have a key!';
  }
}

function indexOfAction(array, key) {
  return array.findIndex(
    ({ meta: { offline: { queue = null } } }) => queue && queue.key === key
  );
}

function mergeActions(queueAction, newAction) {
  return {
    ...queueAction,
    meta: {
      ...queueAction.meta,
      offline: {
        ...newAction.meta.offline
      }
    }
  };
}

function safeToProceed(index, context) {
  return !context.offline.busy || index !== 0;
}

export function enqueue(array, action, context) {
  const { meta: { offline: { queue = null } } } = action;
  
  if (!queue) {
    return [...array, action];
  }
  let index, queueAction;
  const { method = 'UNKNOWN', key = null } = queue;

  validate(key);
  index = indexOfAction(array, key);

  switch (method) {
    case CREATE:
      if (index !== -1) {
        console.warn('Duplicate CREATE action found, every CREATE action should have unique key!');
        return array;
      }
      return [...array, action];
    case DELETE:
      if (index !== -1) {
        queueAction = array[index];
        if (safeToProceed(index, context) &&
          (queueAction.meta.offline.queue.method === UPDATE
          || queueAction.meta.offline.queue.method === CREATE)) {
          array.splice(index, 1);
        }
      }
      return array;
    case UPDATE:
      if (index !== -1) {
        queueAction = array[index];
        if (safeToProceed(index, context) &&
          queueAction.meta.offline.queue.method === CREATE) {
          array[index] = mergeActions(array[index], action);
        }
      }
      return array;
    case READ:
      if (index !== -1) {
        queueAction = array[index];
        if (safeToProceed(index, context) &&
          queueAction.meta.offline.queue.method === READ) {
          array[index] = mergeActions(array[index], action);
        }
      } else {
        return [...array, action];
      }
      return array;
    default:
      throw 'Missing method definition, the "method" value should be either of [CREATE, READ, DELETE, UPDATE]!';
  }
}
