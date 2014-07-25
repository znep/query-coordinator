angular.module('dataCards.services').factory('numberFormatter', function() {
  var formatNumber, numberToString;
  formatNumber = function(num, options) {
    var abbr, decimals, factor, getGroup, group, idx, negative, precision, remainingWholes, render, rules, wholes, _ref, _ref1, _ref2, _ref3;
    if (options == null) {
      options = {};
    }
    if (options.maxPrecision != null) {
      factor = Math.pow(10, options.maxPrecision);
      num = Math.round(num * factor) / factor;
    }
    abbr = 0;
    _ref = numberToString(num).split('.'), wholes = _ref[0], decimals = _ref[1];
    negative = wholes.substring(0, 1) === '-' ? (wholes = wholes.substring(1), '-') : '';
    if (decimals == null) {
      decimals = '';
    }
    if ((options.fixedPrecision != null) || (options.minSigFigs != null)) {
      precision = (_ref1 = options.fixedPrecision) != null ? _ref1 : 0;
      if (options.minSigFigs != null) {
        precision = Math.max(precision, options.minSigFigs - wholes.length + (wholes === '0' ? 1 : 0));
      }
    }
    decimals = (decimals + (new Array((precision != null ? precision : 0) + 1)).join('0')).substring(0, precision);
    render = function(separators) {
      var decSep, groupSep, multiplier, multipliers, _ref2;
      if (separators == null) {
        separators = true;
      }
      groupSep = separators === true && options.suppressGroups !== true ? ',' : '';
      decSep = separators === true && decimals.length > 0 ? '.' : '';
      multipliers = options.fullTextMultiplier != null ? ['', ' thousand', ' million', ' billion', ' trillion', ' quadrillion', ' quintillion'] : ['', 'K', 'M', 'B', 'T', 'Qd', 'Qt'];
      multiplier = separators === true ? multipliers[abbr] : '';
      return ((_ref2 = options.currency) != null ? _ref2 : '') + ("" + negative + (wholes.join(groupSep)) + decSep + decimals) + multiplier;
    };
    if ((options.maxLength != null) || options.suppressGroups !== false) {
      group = 0;
      remainingWholes = wholes;
      wholes = [];
      rules = {
        "number": {
          "groups": {
            '...': 3
          }
        }
      };
      getGroup = function(x) {
        var _ref2;
        return (_ref2 = rules.number.groups[group]) != null ? _ref2 : rules.number.groups['...'];
      };
      while (remainingWholes.length > getGroup(group)) {
        idx = remainingWholes.length - getGroup(group);
        wholes.unshift(remainingWholes.substring(idx));
        remainingWholes = remainingWholes.substring(0, idx);
        group = group + 1;
      }
      if (remainingWholes.length > 0) {
        wholes.unshift(remainingWholes);
      }
      if (options.maxLength != null) {
        precision = (_ref2 = (_ref3 = options.abbrPrecision) != null ? _ref3 : precision) != null ? _ref2 : 2;
        while (true) {
          decimals = decimals.substring(0, precision);
          if (render(false).length <= options.maxLength) {
            break;
          }
          if (wholes.length > 1) {
            abbr = abbr + 1;
            decimals = wholes.pop() + decimals;
          } else if (precision > 0) {
            if (precision > 1) {
              decimals = numberToString(Math.round(parseInt(decimals) / 10));
            } else {
              wholes[wholes.length - 1] = numberToString(Math.round(parseFloat("" + (_.last(wholes)) + "." + decimals)));
            }
            precision -= 1;
          } else {
            break;
          }
        }
      }
    } else {
      wholes = [wholes];
    }
    return render();
  };
  numberToString = function(x) {
    var e, __, _ref, _ref1;
    if (Math.abs(x) < 1.0) {
      _ref = x.toString().split('e-'), __ = _ref[0], e = _ref[1];
      e = parseInt(e);
      if (!_.isNaN(e)) {
        x = x * Math.pow(10, e - 1);
        x = "0." + ((new Array(e)).join('0')) + (x.toString().substring(2));
      }
    } else {
      _ref1 = x.toString().split('+'), __ = _ref1[0], e = _ref1[1];
      e = parseInt(e);
      if (e > 20) {
        e = e - 20;
        x = x / Math.pow(10, e);
        x = "" + x + ((new Array(e + 1)).join('0'));
      }
    }
    return x.toString();
  };
  return {
    formatNumber: formatNumber,
    numberToString: numberToString
  };
});
