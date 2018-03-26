import * as QueueActionTypes from './action-types';

function validKey(key) {
  if (key === null) {
    const message = "Missing key, every queue action should have a key!";
    console.log(message);
    return false;
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

  index = indexOfItem(array, key);

  switch(method) {
    case QueueActionTypes.CREATE:
      if (index !== -1) {
        array[index] = {...array[index], ...item}; 
        return array;
      }
      return [...array, item];
    case QueueActionTypes.DELETE:
      if (index !== -1) {
        existingItem = array[index];
        if (existingItem.meta.offline.queue.method === QueueActionTypes.UPDATE ||
            existingItem.meta.offline.queue.method === QueueActionTypes.CREATE) {
            array.splice(index, 1);
        }
      }
      return array;
    case QueueActionTypes.UPDATE:
      if (index !== -1) {
        existingItem = array[index];
        if (existingItem.meta.offline.queue.method === QueueActionTypes.CREATE) {
          array[index] = {...array[index], ...item};
        }
      }
      return array;
    case QueueActionTypes.READ:
      if (index !== -1) {
        existingItem = array[index];
        if (existingItem.meta.offline.queue.method === QueueActionTypes.READ) {
          array[index] = {...array[index], ...item};
        }
      } else {
        return [...array, item];
      }
      return array;
    default:
      console.log('Missing method definition, the "method" value should be either of [CREATE, READ, DELETE, UPDATE], ignoring this actions!');
      return array
  }
}