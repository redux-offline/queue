import Q from "../index";
import * as QueueActionTypes from "../action-types";

let queue = [];
let createQueueAction = {
  type: "CREATE",
  meta: { offline: { effect: {body: {}}, commit: {meta: {}}, rollback: {meta: {}}, queue: { method: QueueActionTypes.CREATE, key: "1" } } }
};
let createQueueAction2 = {
  type: "CREATE2",
  meta: { offline: { effect: {body: {}}, commit: {meta: {}}, rollback: {meta: {}}, queue: { method: QueueActionTypes.CREATE, key: "2" } } }
};
let createQueueAction3 = {
  type: "CREATE3",
  meta: { offline: { effect: {body: {}}, commit: {meta: {}}, rollback: {meta: {}}, queue: { method: QueueActionTypes.CREATE, key: "3" } } }
};
let updateQueueAction = {
  type: "UPDATE",
  meta: { offline: { effect: {body: {}}, commit: {meta: {}}, rollback: {meta: {}}, queue: { method: QueueActionTypes.UPDATE, key: "1" } } }
};
let updateQueueAction2 = {
  type: "UPDATE2",
  meta: { offline: { effect: {body: {}}, commit: {meta: {}}, rollback: {meta: {}}, queue: { method: QueueActionTypes.UPDATE, key: "2" } } }
};
let updateNonExistingQueueAction = {
  type: "Non-Existing",
  meta: { offline: { effect: {body: {}}, commit: {meta: {}}, rollback: {meta: {}}, queue: { method: QueueActionTypes.UPDATE, key: "-1" } } }
};
let deleteQueueAction = {
  type: "DELETE",
  meta: { offline: { effect: {body: {}}, commit: {meta: {}}, rollback: {meta: {}}, queue: { method: QueueActionTypes.DELETE, key: "1" } } }
};
let deleteQueueAction2 = {
  type: "DELETE2",
  meta: { offline: { effect: {body: {}}, commit: {meta: {}}, rollback: {meta: {}}, queue: { method: QueueActionTypes.DELETE, key: "2" } } }
};
let deleteNonExistingQueueAction = {
  type: "NON-Existing",
  meta: { offline: { effect: {body: {}}, commit: {meta: {}}, rollback: {meta: {}}, queue: { method: QueueActionTypes.DELETE, key: "-1" } } }
};
let readQueueAction = {
  type: "READ",
  meta: { offline: { effect: {body: {}}, commit: {meta: {}}, rollback: {meta: {}}, queue: { method: QueueActionTypes.READ, key: "1" } } }
};
let readQueueAction2 = {
  type: "READ2",
  meta: { offline: { effect: {body: {}}, commit: {meta: {}}, rollback: {meta: {}}, queue: { method: QueueActionTypes.READ, key: "2" } } }
};
let missingActionMethod = {
  type: "MISSING-METHOD",
  meta: { offline: { effect: {body: {}}, commit: {meta: {}}, rollback: {meta: {}}, queue: { method: null, key: "2" } } }
};
let missingActionKey = {
  type: "MISSING-KEY",
  meta: { offline: { effect: {body: {}}, commit: {meta: {}}, rollback: {meta: {}}, queue: { method: QueueActionTypes.CREATE, key: null } } }
};
let vanilaAction = { type: "VANILA_ACTION", meta: { offline: {} } };

var state = {};

beforeAll(() => {
  global.console = {warn: jest.fn()};
});

beforeEach(() => {
  queue = [];
  state = {
    lastTransaction: 0,
    busy: false,
    outbox: []
  }
});

function simulateEnqueue(action) {
  if (action.meta && action.meta.offline) {
    const transaction = state.lastTransaction + 1;
    const stamped = {
      ...action,
      meta: { ...action.meta, transaction }
    };
    const { outbox, ...offline } = state;
    state = {
      ...state,
      lastTransaction: transaction,
      outbox: Q.enqueue(outbox, stamped, { offline })
    };
  }
}

function simulatePeek() {
  return Q.peek(state.outbox, null, { offline: state.offline });
}

function simulateDequeue() {
  state.outbox = Q.dequeue(state.outbox, null, { offline: state.offline });
}

function send() {
  state.busy = true;
}

function sendComplete() {
  state.busy = false;
}
// create single item
test("Single insertion test", () => {
  simulateEnqueue(createQueueAction);
  expect(state.outbox.length).toBe(1);
});

// create then update same item
test("Create then update same item", () => {
  simulateEnqueue(createQueueAction);
  simulateEnqueue(updateQueueAction);
  expect(state.outbox.length).toBe(1);
  expect(Q.peek(state.outbox).meta.offline.queue.method).toBe(QueueActionTypes.UPDATE);
});

test("Create then update then delete same item", () => {
  simulateEnqueue(createQueueAction);
  simulateEnqueue(updateQueueAction);
  simulateEnqueue(deleteQueueAction);
  expect(state.outbox.length).toBe(0);
});

test("Insert then read", () => {
  simulateEnqueue(createQueueAction);
  expect(Q.peek(state.outbox).meta.offline.queue.key).toBe("1");
});

test("Insert -> update then read", () => {
  simulateEnqueue(createQueueAction);
  simulateEnqueue(updateQueueAction);
  expect(simulatePeek().meta.offline.queue.key).toBe("1");
  expect(simulatePeek().type).toBe("CREATE");
  expect(simulatePeek().meta.offline.queue.method).toBe(QueueActionTypes.UPDATE);
});

test("Multiple create with same key", () => {
  simulateEnqueue(createQueueAction);
  simulateEnqueue(createQueueAction);
  expect(console.warn).toBeCalled()
  simulateEnqueue(createQueueAction);
  expect(console.warn).toBeCalled()
  expect(state.outbox.length).toBe(1);
});

test("Multiple create with different keys", () => {
  simulateEnqueue(createQueueAction);
  simulateEnqueue(createQueueAction2);
  simulateEnqueue(createQueueAction3);
  expect(state.outbox.length).toBe(3);
  expect(simulatePeek().type).toBe("CREATE");
  simulateDequeue();
  expect(simulatePeek().type).toBe("CREATE2");
  simulateDequeue();
  expect(simulatePeek().type).toBe("CREATE3");
});

test("Multiple create with same key followed by delete", () => {
  simulateEnqueue(createQueueAction);
  simulateEnqueue(createQueueAction);
  simulateEnqueue(createQueueAction);
  expect(console.warn).toBeCalled();
  const item = simulatePeek();
  expect(item.type).toBe("CREATE");
  expect(state.outbox.length).toBe(1);
  queue = simulateEnqueue(deleteQueueAction);
  expect(state.outbox.length).toBe(0);
});

test("Multiple create with different key followed by delete", () => {
  simulateEnqueue(createQueueAction);
  simulateEnqueue(createQueueAction2);
  simulateEnqueue(createQueueAction3);
  simulateEnqueue(deleteQueueAction2);
  expect(state.outbox.length).toBe(2);
});

test("Multiple create with different key followed by delete and 2 peek", () => {
  simulateEnqueue(createQueueAction);
  simulateEnqueue(createQueueAction2);
  simulateEnqueue(createQueueAction3);
  simulateEnqueue(deleteQueueAction2);
  const firstItem = simulatePeek();
  simulateDequeue();
  const thirdItem = simulatePeek();
  expect(firstItem.type).toBe("CREATE");
  expect(thirdItem.type).toBe("CREATE3");
});

test("2 creates followed by update of first item", () => {
  simulateEnqueue(createQueueAction);
  simulateEnqueue(createQueueAction2);
  simulateEnqueue(updateQueueAction);
  const firstItem = simulatePeek();
  simulateDequeue();
  const secondItem = simulatePeek();
  expect(firstItem.type).toBe("CREATE");
  expect(firstItem.meta.offline.queue.method).toBe(QueueActionTypes.UPDATE);
  expect(secondItem.type).toBe("CREATE2");
  expect(secondItem.meta.offline.queue.method).toBe(QueueActionTypes.CREATE);
});

test("2 creates followed by update of second item", () => {
  simulateEnqueue(createQueueAction);
  simulateEnqueue(createQueueAction2);
  simulateEnqueue(updateQueueAction2);
  const firstItem = simulatePeek();
  simulateDequeue()
  const secondItem = simulatePeek();
  expect(firstItem.type).toBe("CREATE");
  expect(firstItem.meta.offline.queue.method).toBe(QueueActionTypes.CREATE);
  expect(secondItem.type).toBe("CREATE2");
  expect(secondItem.meta.offline.queue.method).toBe(QueueActionTypes.UPDATE);
});

test("2 reads", () => {
  simulateEnqueue(readQueueAction);
  simulateEnqueue(readQueueAction2);
  const firstItem = simulatePeek();
  queue = simulateDequeue();
  const thirdItem = simulatePeek();
  expect(firstItem.type).toBe("READ");
  expect(thirdItem.type).toBe("READ2");
});

test("Delete non-existing queue actions", () => {
  simulateEnqueue(createQueueAction);
  simulateEnqueue(createQueueAction2);
  simulateEnqueue(deleteNonExistingQueueAction);
  const firstItem = simulatePeek();
  simulateDequeue();
  const thirdItem = simulatePeek();
  expect(firstItem.type).toBe("CREATE");
  expect(thirdItem.type).toBe("CREATE2");
});

test("Update non-existing queue actions", () => {
  simulateEnqueue(createQueueAction);
  simulateEnqueue(createQueueAction2);
  simulateEnqueue(updateNonExistingQueueAction);
  const firstItem = simulatePeek();
  simulateDequeue();
  const thirdItem = simulatePeek();
  expect(firstItem.type).toBe("CREATE");
  expect(thirdItem.type).toBe("CREATE2");
});

test("Missing action method", () => {
  simulateEnqueue(createQueueAction);
  simulateEnqueue(createQueueAction2);
  expect(() => {
    simulateEnqueue(missingActionMethod);
  }).toThrow();
});

test("Missing action key", () => {
  simulateEnqueue(createQueueAction);
  simulateEnqueue(createQueueAction2);
  expect(() => {
    simulateEnqueue(missingActionKey);
  }).toThrow();
});

test("add valina action to queue", () => {
  simulateEnqueue(vanilaAction);
  simulateEnqueue(vanilaAction);
  expect(state.outbox.length).toBe(2);
});

test("Valina action with Smart-queue action to queue", () => {
  simulateEnqueue(vanilaAction);
  simulateEnqueue(vanilaAction);
  simulateEnqueue(createQueueAction);
  simulateEnqueue(createQueueAction2);
  expect(state.outbox.length).toBe(4);
});

test("Valina action with duplicate Smart-queue action to queue", () => {
  simulateEnqueue(vanilaAction);
  simulateEnqueue(vanilaAction);
  simulateEnqueue(createQueueAction);
  simulateEnqueue(createQueueAction);
  expect(state.outbox.length).toBe(3);
  expect(console.warn).toBeCalled();
});

test("Valina action and duplicate Smart-queue action reading from queue", () => {
  simulateEnqueue(vanilaAction);
  simulateEnqueue(vanilaAction);
  simulateEnqueue(createQueueAction);
  simulateEnqueue(createQueueAction);
  expect(console.warn).toBeCalled();
  expect(state.outbox.length).toBe(3);
  let item = simulatePeek();
  simulateDequeue();
  expect(item.type).toBe("VANILA_ACTION");
  item = simulatePeek();
  simulateDequeue();
  expect(item.type).toBe("VANILA_ACTION");
  item = simulatePeek();
  simulateDequeue();
  expect(item.type).toBe("CREATE");
});

test("update currently processing action", () => {
  simulateEnqueue(createQueueAction);
  send();
  simulateEnqueue(createQueueAction2);
  simulateEnqueue(updateQueueAction);
  sendComplete();
  let firstItem = simulatePeek();
  simulateDequeue();
  let secondItem = simulatePeek();
  expect(firstItem.type).toBe('CREATE');
  expect(secondItem.type).toBe('CREATE2');
});

test("delete currently processing action", () => {
  simulateEnqueue(createQueueAction);
  send();
  simulateEnqueue(createQueueAction2);
  simulateEnqueue(deleteQueueAction);
  sendComplete();
  let firstItem = simulatePeek();
  simulateDequeue();
  let secondItem = simulatePeek();
  expect(firstItem.type).toBe('CREATE');
  expect(secondItem.type).toBe('CREATE2');
});

test("update non-processing action", () => {
  simulateEnqueue(createQueueAction);
  send();
  simulateEnqueue(createQueueAction2);
  simulateEnqueue(updateQueueAction2);
  sendComplete();
  let firstItem = simulatePeek();
  simulateDequeue();
  let secondItem = simulatePeek();
  expect(firstItem.type).toBe('CREATE');
  expect(secondItem.type).toBe('CREATE2');
});

test("delete non-processing action", () => {
  simulateEnqueue(createQueueAction);
  send();
  simulateEnqueue(createQueueAction2);
  simulateEnqueue(deleteQueueAction2);
  sendComplete();
  let firstItem = simulatePeek();
  expect(state.outbox.length).toBe(1);
  simulateDequeue();
  expect(state.outbox.length).toBe(0);
});

test("update then delete non-processing action", () => {
  simulateEnqueue(createQueueAction);
  send();
  simulateEnqueue(createQueueAction2);
  simulateEnqueue(updateQueueAction2);
  simulateEnqueue(deleteQueueAction2);
  sendComplete();
  let firstItem = simulatePeek();
  expect(state.outbox.length).toBe(1);
  simulateDequeue();
  expect(state.outbox.length).toBe(0);
});
