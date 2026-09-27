// textpos.js：文本的定位与编辑（位置从零数，行列从一数）
function codedError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

// pos 落在哪个字符上：返回 [行, 列]，行按 \n 切，列从行首数起，都从一数。
export function locate(text, pos) {
  if (!Number.isInteger(pos) || pos < 0 || pos >= text.length) {
    throw codedError("E_OUT_OF_RANGE", "position " + pos + " is not on a character");
  }
  let line = 1;
  let lineStart = 0;
  for (let i = 0; i < pos; i += 1) {
    if (text.charCodeAt(i) === 10) {
      line += 1;
      lineStart = i + 1;
    }
  }
  return [line, pos - lineStart + 1];
}

// 把 chunk 塞进 pos（0..length，等于长度即追加）。
export function insertText(text, pos, chunk) {
  if (!Number.isInteger(pos) || pos < 0 || pos > text.length) {
    throw codedError("E_OUT_OF_RANGE",
      "insert position " + pos + " exceeds text length " + text.length);
  }
  return text.slice(0, pos) + chunk + text.slice(pos);
}

// 砍掉左闭右开区间 [from, to)；from > to 写反，越界不合法。
export function deleteRange(text, from, to) {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0) {
    throw codedError("E_OUT_OF_RANGE", "delete range outside text");
  }
  if (from > to) {
    throw codedError("E_BAD_RANGE", "delete range start " + from + " is after end " + to);
  }
  if (to > text.length) {
    throw codedError("E_OUT_OF_RANGE",
      "delete range end " + to + " exceeds text length " + text.length);
  }
  return text.slice(0, from) + text.slice(to);
}
