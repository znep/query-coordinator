var blistUtilNS = blist.namespace.fetch('blist.util');

blistUtilNS.toHumaneNumber = function(val, precision) {
  var symbol = ['K', 'M', 'B', 'T'];
  var step = 1000;
  var divider = Math.pow(step, symbol.length);
  var absVal = Math.abs(val);
  var result;

  val = parseFloat(val);

  for (var i = symbol.length - 1; i >= 0; i--) {
    if (absVal >= divider) {
      result = (absVal / divider).toFixed(precision);
      if (val < 0) {
        result = -result;
      }
      return result + symbol[i];
    }

    divider = divider / step;
  }

  return val.toFixed(precision);
};

blistUtilNS.parseHumaneNumber = function(val) {
  var symbol = ['K', 'M', 'B', 'T'];
  var step = 1000;
  var adjVal;
  var i;

  if ($.isBlank(val)) {
    return val;
  }

  var lastChar = val.charAt(val.length - 1);
  lastChar = lastChar.valueOf().toUpperCase();
  for (i = symbol.length - 1; i >= 0; i--) {
    if (lastChar === symbol[i]) {
      adjVal = val.slice(0, val.length - 1);
      return parseFloat(adjVal) ? adjVal * Math.pow(step, i + 1) : val;
    }
  }

  return val;
};
