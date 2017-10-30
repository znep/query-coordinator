import _ from 'lodash';

export function commaify(value, separator, decimalSeparator) {
  separator = _.isUndefined(separator) ? ',' : separator;
  decimalSeparator = _.isUndefined(decimalSeparator) ? '.' : decimalSeparator;

  value = value.toString();
  var pos = value.indexOf('.');
  var dec = '';
  if (pos === -1) {
    // The value is an integer
    pos = value.length;
    decimalSeparator = '';
  } else {
    // The value has decimals
    dec = value.slice(pos + 1, value.length);
    value = value.slice(0, pos);
  }
  pos -= 3;
  while (pos > 0 && value.charAt(pos - 1) >= '0' && value.charAt(pos - 1) <= '9') {
    value = `${value.substring(0, pos)}${separator}${value.substring(pos)}`;
    pos -= 3;
  }
  return `${value}${decimalSeparator}${dec}`;
}
