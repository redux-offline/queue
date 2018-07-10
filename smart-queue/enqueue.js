import { CREATE, UPDATE, DELETE, READ } from './action-types';

function validate(key) {
  if (key === null) {
    throw new Error('Missing key, every queue action should have a key!');
  }
}

function indexOfAction(array, key) {
  return array.findIndex(
    ({
      meta: {
        offline: { queue = null }
      }
    }) => queue && queue.key === key
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
  const outbox = array;
  let queueAction;
  const {
    meta: {
      offline: { queue = null }
    }
  } = action;

  if (!queue) {
    return [...outbox, action];
  }

  const { method = 'UNKNOWN', key = null } = queue;

  validate(key);
  const index = indexOfAction(outbox, key);

  switch (method) {
    case CREATE:
      if (index !== -1) {
        // eslint-disable-next-line no-console
        console.warn(
          'Duplicate CREATE action found, every CREATE action should have unique key!'
        );
        return outbox;
      }
      return [...outbox, action];
    case DELETE:
      if (index !== -1) {
        queueAction = outbox[index];
        if (
          safeToProceed(index, context) &&
          (queueAction.meta.offline.queue.method === UPDATE ||
            queueAction.meta.offline.queue.method === CREATE)
        ) {
          outbox.splice(index, 1);
        }
      }
      return outbox;
    case UPDATE:
      if (index !== -1) {
        queueAction = outbox[index];
        if (
          safeToProceed(index, context) &&
          queueAction.meta.offline.queue.method === CREATE
        ) {
          outbox[index] = mergeActions(outbox[index], action);
        }
      }
      return outbox;
    case READ:
      if (index !== -1) {
        queueAction = outbox[index];
        if (
          safeToProceed(index, context) &&
          queueAction.meta.offline.queue.method === READ
        ) {
          outbox[index] = mergeActions(outbox[index], action);
        }
      } else {
        return [...outbox, action];
      }
      return outbox;
    default:
      throw new Error(
        'Missing method definition, the "method" value should be either of [CREATE, READ, DELETE, UPDATE]!'
      );
  }
}
