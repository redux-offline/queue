import * as QueueActionTypes from "./action-types";

function validate(key, method) {
  if (key === null) {
    throw 'Missing key, every queue action should have a key!';
  }
  if (!QueueActionTypes[method])
    throw 'Missing method definition, the "method" value should be either of [CREATE, READ, DELETE, UPDATE]!';
}

function indexOfAction(array, key) {
  return array.findIndex(
    ({ meta: { offline: { queue = null } } }) => queue && queue.key === key
  );
}

function mergeActions(existingAction, newAction) {
  return {
    ...existingAction,
    meta: {
      ...existingAction.meta,
      offline: {
        ...existingAction.meta.offline,
        effect: {
          ...existingAction.meta.offline.effect,
          body: newAction.meta.offline.effect.body
        },
        commit: {
          ...existingAction.meta.offline.commit,
          meta: newAction.meta.offline.commit.meta
        },
        rollback: {
          ...existingAction.meta.offline.rollback,
          meta: newAction.meta.offline.rollback.meta
        },
        queue: {
          ...newAction.meta.offline.queue
        }
      }
    }
  };
}
export function enqueue(array, action) {
  const { meta: { offline: { queue = null } } } = action;
  
  if (!queue) {
    return [...array, action];
  }
  let index, existingAction;
  const { method = 'UNKNOWN', key = null } = queue;

  validate(key, method);
  index = indexOfAction(array, key);

  switch (method) {
    case QueueActionTypes.CREATE:
      if (index !== -1) {
        console.warn('Duplicate CREATE action found, every CREATE action should have unique key!');
        return array;
      }
      return [...array, action];
    case QueueActionTypes.DELETE:
      if (index !== -1) {
        existingAction = array[index];
        if ( existingAction.meta.offline.queue.key === key && (
          existingAction.meta.offline.queue.method ===
            QueueActionTypes.UPDATE ||
          existingAction.meta.offline.queue.method === QueueActionTypes.CREATE)
        ) {
          array.splice(index, 1);
        }
      }
      return array;
    case QueueActionTypes.UPDATE:
      if (index !== -1) {
        existingAction = array[index];
        if ( existingAction.meta.offline.queue.key === key &&
          existingAction.meta.offline.queue.method === QueueActionTypes.CREATE
        ) {
          array[index] = mergeActions(array[index], action);
        }
      }
      return array;
    case QueueActionTypes.READ:
      if (index !== -1) {
        existingAction = array[index];
        if (
          existingAction.meta.offline.queue.method === QueueActionTypes.READ
        ) {
          array[index] = mergeActions(array[index], action);
        }
      } else {
        return [...array, action];
      }
      return array;
  }
}
