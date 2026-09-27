// textpos.js：文本的定位与编辑（位置从零数，行列从一数）
function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

export function locate(text, pos) {
  if (typeof pos !== "number" || !Number.isFinite(pos) || pos < 0 || pos >= text.length) {
    fail("E_OUT_OF_RANGE", "查询位置不在字符上: " + pos);
  }
  let line = 1;
  let lineStart = 0;
  for (let index = 0; index < pos; index += 1) {
    if (text[index] === "\n") {
      line += 1;
      lineStart = index + 1;
    }
  }
  return [line, pos - lineStart + 1];
}

export function insertText(text, pos, chunk) {
  if (typeof pos !== "number" || !Number.isFinite(pos) || pos < 0 || pos > text.length) {
    fail("E_OUT_OF_RANGE", "插入位置超出文本长度: " + pos);
  }
  return text.slice(0, pos) + chunk + text.slice(pos);
}

export function deleteRange(text, from, to) {
  if (from > to) {
    fail("E_BAD_RANGE", "删除区间起点大于终点: " + from + " > " + to);
  }
  if (from < 0 || to > text.length) {
    fail("E_OUT_OF_RANGE", "删除区间超出文本长度: [" + from + ", " + to + ")");
  }
  return text.slice(0, from) + text.slice(to);
}
