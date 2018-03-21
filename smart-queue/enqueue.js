import * as QueueActionTypes from './action-types';

function validKey(key) {
  if (key === null) {
    const message = "Every queue action should have a key";
    console.log(message);
  }
  return true;
}

function indexOfItem(array, key) {
  return array.findIndex(({meta:{offline:{queue}}}) => queue.key === key);
}

export function enqueue(array, item) {
  const { meta: { offline : { queue: { method = 'UNKNOWN', key = null } } } } = item;
  let index, existingItem;

  if (!validKey(key)) {
    return array;
  }

  switch(method) {
    case QueueActionTypes.CREATE:
      return [...array, item];
    case QueueActionTypes.DELETE:
      index = indexOfItem(array, key);
      if (index !== -1) {
        existingItem = array[index];
        if (existingItem.meta.offline.queue.method === QueueActionTypes.UPDATE ||
            existingItem.meta.offline.queue.method === QueueActionTypes.CREATE) {
            array.splice(index, 1);
        }
      }
      return array;
    case QueueActionTypes.UPDATE:
      index = indexOfItem(array, key);
      if (index !== -1) {
        existingItem = array[index];
        if (existingItem.meta.offline.queue.method === QueueActionTypes.CREATE) {
          array[index] = {...array[index], ...item};
        }
      }
      return array;
    case QueueActionTypes.READ:
      index = indexOfItem(array, key);
      if (index !== -1) {
        existingItem = array[index];
        if (existingItem.meta.offline.queue.method === QueueActionTypes.READ) {
          array[index] = {...array[index], ...item};
        }
      }
      return array;
    default:
      console.warn('Method not defined in queue action, ignoring this action'); //TODO: improve this message
      return array
  }
}