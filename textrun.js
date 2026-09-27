// textrun.js：按处理预算处理并留账
import { locate, insertText, deleteRange } from "./textpos.js";

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function codes(spec) {
  return {
    range: spec.range_error_code || "E_OUT_OF_RANGE",
    span: spec.span_error_code || "E_BAD_RANGE",
    event: spec.event_error_code || "E_BAD_EVENT"
  };
}

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function validateEvent(event, code) {
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    fail(code, "事件不是对象");
  }
  if (event.kind === "insert") {
    if (!isNumber(event.pos) || typeof event.text !== "string") {
      fail(code, "insert 事件缺 pos 或 text");
    }
  } else if (event.kind === "delete") {
    if (!isNumber(event.from) || !isNumber(event.to)) {
      fail(code, "delete 事件缺 from 或 to");
    }
  } else if (event.kind === "at") {
    if (!isNumber(event.pos)) {
      fail(code, "at 事件缺 pos");
    }
  } else {
    fail(code, "未知事件类型: " + String(event.kind));
  }
}

// 账面条目就是 [kind, ...args] 数组；id 挂在数组对象上，
// JSON 序列化时只出下标元素，跨轮仍能按 id 去重。
function toEntry(event) {
  let entry;
  if (event.kind === "insert") entry = ["insert", event.pos, event.text];
  else if (event.kind === "delete") entry = ["delete", event.from, event.to];
  else entry = ["at", event.pos];
  if (event.id !== undefined) entry.id = event.id;
  return entry;
}

function applyEntry(entry, text, found, code) {
  if (entry[0] === "insert") {
    if (entry[1] < 0 || entry[1] > text.length) {
      fail(code.range, "插入位置超出文本长度: " + entry[1]);
    }
    return insertText(text, entry[1], entry[2]);
  }
  if (entry[0] === "delete") {
    if (entry[1] > entry[2]) {
      fail(code.span, "删除区间起点大于终点: " + entry[1] + " > " + entry[2]);
    }
    if (entry[1] < 0 || entry[2] > text.length) {
      fail(code.range, "删除区间超出文本长度: [" + entry[1] + ", " + entry[2] + ")");
    }
    return deleteRange(text, entry[1], entry[2]);
  }
  if (entry[1] < 0 || entry[1] >= text.length) {
    fail(code.range, "查询位置不在字符上: " + entry[1]);
  }
  found.push(locate(text, entry[1]));
  return text;
}

function freshState(state) {
  return {
    text: state.text,
    found: state.found.map(function (pair) { return [pair[0], pair[1]]; }),
    ledger: [],
    applied: state.applied.slice()
  };
}

export function step(spec) {
  const code = codes(spec);
  const state = spec.state;
  const events = spec.events || [];
  let rest = Math.max(0, spec.budget || 0);
  events.forEach(function (event) { validateEvent(event, code.event); });

  const next = freshState(state);
  const pending = state.ledger.slice();
  events.forEach(function (event) { pending.push(toEntry(event)); });

  let served = 0;
  pending.forEach(function (entry) {
    if (entry.id !== undefined && next.applied.indexOf(entry.id) !== -1) return;
    if (rest > 0) {
      rest -= 1;
      next.text = applyEntry(entry, next.text, next.found, code);
      served += 1;
      if (entry.id !== undefined) next.applied.push(entry.id);
    } else {
      next.ledger.push(entry);
    }
  });

  return {
    state: next,
    served: served,
    ledger_before: next.ledger.length,
    ledger: next.ledger,
    judged: served,
    judged_bound: pending.length
  };
}

export function close(spec) {
  const code = codes(spec);
  const state = spec.state;
  const next = freshState(state);

  let catchup = 0;
  state.ledger.forEach(function (entry) {
    if (entry.id !== undefined && next.applied.indexOf(entry.id) !== -1) return;
    next.text = applyEntry(entry, next.text, next.found, code);
    catchup += 1;
    if (entry.id !== undefined) next.applied.push(entry.id);
  });

  return { state: next, catchup: catchup };
}
