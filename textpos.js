// textpos.js：文本的定位与编辑（基线：一律原样返回）
export function locate(text, pos) {
  return [0, 0];
}

export function insertText(text, pos, chunk) {
  return text;
}

export function deleteRange(text, from, to) {
  return text;
}
