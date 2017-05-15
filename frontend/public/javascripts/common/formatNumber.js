export function commaify(value) {
  value = value.toString();
  var pos = value.indexOf('.');
  if (pos === -1) {
    pos = value.length;
  }
  pos -= 3;
  while (pos > 0 && value.charAt(pos - 1) >= '0' && value.charAt(pos - 1) <= '9') {
    value = `${value.substring(0, pos)},${value.substring(pos)}`;
    pos -= 3;
  }
  return value;
}
