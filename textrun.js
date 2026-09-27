// textrun.js：按处理预算处理事件，处理不完的连着载压在账上带出下一轮；收尾不限预算。
import { locate, insertText, deleteRange } from "./textpos.js";

function codedError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

// 账上一条记录：[kind, ...参数]，不带 id。
function encodeEvent(event) {
  if (event.kind === "insert") return ["insert", event.pos, event.text];
  if (event.kind === "delete") return ["delete", event.from, event.to];
  return ["at", event.pos];
}

// 事件结构先校验，与预算无关：不合法报 E_BAD_EVENT。
function validateEvent(event) {
  if (!event || typeof event !== "object") {
    throw codedError("E_BAD_EVENT", "event must be an object");
  }
  if (event.kind === "insert") {
    if (!Number.isInteger(event.pos) || typeof event.text !== "string") {
      throw codedError("E_BAD_EVENT", "insert needs integer pos and string text");
    }
    return;
  }
  if (event.kind === "delete") {
    if (!Number.isInteger(event.from) || !Number.isInteger(event.to)) {
      throw codedError("E_BAD_EVENT", "delete needs integer from and to");
    }
    return;
  }
  if (event.kind === "at") {
    if (!Number.isInteger(event.pos)) {
      throw codedError("E_BAD_EVENT", "at needs integer pos");
    }
    return;
  }
  throw codedError("E_BAD_EVENT", "unknown event kind " + String(event.kind));
}

function applyItem(state, item) {
  if (item[0] === "insert") {
    state.text = insertText(state.text, item[1], item[2]);
  } else if (item[0] === "delete") {
    state.text = deleteRange(state.text, item[1], item[2]);
  } else {
    state.found.push(locate(state.text, item[1]));
  }
}

function markApplied(state, id) {
  if (id !== undefined && id !== null && state.applied.indexOf(id) === -1) {
    state.applied.push(id);
  }
}

function cloneState(state) {
  const next = {
    text: state.text,
    found: state.found.slice(),
    ledger: state.ledger.map(function (row) { return row.slice(); }),
    applied: state.applied.slice(),
    ledger_ids: (state.ledger_ids || []).slice()
  };
  while (next.ledger_ids.length < next.ledger.length) next.ledger_ids.push(null);
  next.ledger_ids.length = next.ledger.length;
  return next;
}

// 一条事件花一次预算：账上的先处理，处理不完的连着载压回账上；已处理过的事件重放不再处理。
export function step(spec) {
  const state = cloneState(spec.state);
  const events = spec.events || [];
  events.forEach(validateEvent);

  const queue = [];
  state.ledger.forEach(function (row, index) {
    queue.push({ item: row, id: state.ledger_ids[index] });
  });
  events.forEach(function (event) {
    const id = event.id;
    if (id !== undefined && id !== null && state.applied.indexOf(id) !== -1) return;
    queue.push({ item: encodeEvent(event), id: id === undefined ? null : id });
  });

  const bound = queue.length;
  let budget = Number.isInteger(spec.budget) && spec.budget > 0 ? spec.budget : 0;
  let served = 0;
  const ledger = [];
  const ledgerIds = [];
  queue.forEach(function (entry) {
    if (served < budget) {
      applyItem(state, entry.item);
      markApplied(state, entry.id);
      served += 1;
    } else {
      ledger.push(entry.item);
      ledgerIds.push(entry.id);
    }
  });
  state.ledger = ledger;
  state.ledger_ids = ledgerIds;

  return {
    state: state,
    served: served,
    ledger_before: ledger.length,
    ledger: ledger,
    judged: served,
    judged_bound: bound
  };
}

// 收尾：不限预算把账处理完，返回补齐条数。
export function close(spec) {
  const state = cloneState(spec.state);
  let catchup = 0;
  while (state.ledger.length > 0) {
    const item = state.ledger.shift();
    const id = state.ledger_ids.shift();
    applyItem(state, item);
    markApplied(state, id);
    catchup += 1;
  }
  return { state: state, catchup: catchup };
}
