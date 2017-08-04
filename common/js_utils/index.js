// TODO: Make this file pass lint. It is ancient.
/* eslint-disable prefer-rest-params */
/* eslint-disable prefer-template */
/* eslint-disable global-require */
/* eslint-disable padded-blocks */

var _ = require('lodash');
var $ = require('jquery');
var jstz = require('jstz');

if (typeof window.Promise !== 'function') {
  window.Promise = require('es6-promise-polyfill').Promise;
}

var NUMBER_FORMATTER_MAGNITUDE_SYMBOLS = ['K', 'M', 'B', 'T', 'P', 'E', 'Z', 'Y'];
var MOUSE_WHEEL_EVENTS = 'mousewheel DOMMouseScroll MozMousePixelScroll';

/**
 * Usage:
 *
 * 'Hello, {1}!'.format('World');
 * => 'Hello, World!'
 */
var formatWithArgs = function() {

  var txt = this;
  var i;

  for (i = 0; i < arguments.length; i++) {
    txt = txt.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
  }

  return txt;
};

/**
 * Usage:
 *
 * 'Hello, {what}!'.format({ what: 'World'});
 * => 'Hello, World!'
 */
var formatWithObject = function() {

  var values = arguments[0];

  return _(values).
    chain().
    keys().
    reduce(
      function(stringToFormat, key) {
        return stringToFormat.replace(new RegExp('\\{' + key + '\\}', 'gm'), values[key]);
      },
      this
    ).value();
};

/**
 * `format` is assigned to the String prototype at the bottom of this file.
 */
var format = function() {

  if (!_.isPlainObject(arguments[0])) {
    return formatWithArgs.apply(this, arguments);
  } else {
    return formatWithObject.apply(this, arguments);
  }
};

/**
 * `escapeSpaces` is assigned to the String prototype at the bottom of this file.
 */
var escapeSpaces = function() {
  return this.replace(/\s/g, '\u00A0');
};

/**
 * `CustomEvent` is assigned to the window at the bottom of this file.
 */
var CustomEvent = function(eventName, params) {

  var customEventParams = _.assign(
    { bubbles: false, cancelable: false, detail: undefined },
    params
  );

  var customEvent = document.createEvent('CustomEvent');

  customEvent.initCustomEvent(
    eventName,
    customEventParams.bubbles,
    customEventParams.cancelable,
    customEventParams.detail
  );

  return customEvent;
};

var utils = {

  assert: function(expression, message) {
    if (!expression) {
      throw new Error(message);
    }
  },

  assertEqual: function(value1, value2) {

    if (value1 !== value2) {
      throw new Error(
        'Value `{0}` must equal value `{1}`.'.format(value1, value2)
      );
    }
  },

  assertHasProperty: function(object, name, message) {

    if (!_.has(object, name)) {

      if (message) {
        throw new Error(message);
      }

      throw new Error(
        '`{0}` property must be present. Object has properties: [{1}].'.
          format(name, Object.keys(object).join(', '))
      );
    }
  },

  assertHasProperties: function(object) {

    var assertHasProperty = utils.assertHasProperty;

    // Apply all arguments (minus `object`)
    // to assertHasProperty(object, argument).
    _.each(
      _.tail(arguments),
      function(argument) {
        assertHasProperty(object, argument);
      }
    );
  },

  /**
   * Ensures the given value is of any of the provided types.
   *
   * @param {any} value - The value to check
   * @param {...string} <arguments> - List of acceptable types
   */
  assertIsOneOfTypes: function(value) {

    var types = _.tail(arguments);
    var valid = _.includes(types, typeof value);

    if (!valid) {
      throw new Error(
        'Value must be one of [{0}] (is of type {1}).'.
          format(types.join(', '), (typeof value))
      );
    }
  },

  /**
   * Ensures the given value is of Array type.
   *
   * @param {any} object - The object to check
   */
  assertIsArray: function(object) {
    var valid = _.isArray(object);

    utils.assert(valid, `Expected ${object} to be an Array, was ${typeof object}`);
  },

  /**
   * Ensures the given value is a number.
   *
   * @param {any} value - The value to check
   */
  assertIsNumber: function(value) {
    utils.assertIsOneOfTypes(value, 'number');
  },

  /**
   * Asserts that an object is instanceof an instantiator.
   *
   * @param {object} instance - The instance to check.
   * @param {function} instantiator - The instantiator to check against.
   */
  assertInstanceOf: function(instance, instantiator) {
    utils.assertInstanceOfAny(instance, instantiator);
  },

  /**
   * Asserts that an object is instanceof at least one of the provided instantiators.
   *
   * @param {object} instance - The instance to check.
   * @param {...function} <arguments> - List of acceptable instantiators
   */
  assertInstanceOfAny: function(instance) {
    var instantiators = _.tail(arguments);
    var valid = _.some(instantiators, function(instantiator) {
      if (instantiator.toString().indexOf('function Array') > -1) {
        return Array.isArray(instance);
      } else {
        return instance instanceof instantiator;
      }
    });

    if (!valid) {
      throw new Error(
        'Value must be one of [{0}] (instance: {1}).'.
          format(instantiators.join(', '), instance)
      );
    }
  },

  /**
   * Asserts that the given collection is of the expected length.
   *
   * @param {Array | Array-like} collection - The collection to check.
   * @param {Number} expectedLength - The expected length.
   */
  assertLengthIs: function(collection, expectedLength) {
    utils.assertHasProperty(collection, 'length');
    utils.assertIsOneOfTypes(expectedLength, 'number');
    utils.assert(
      collection.length === expectedLength,
      'Expected `{0}` to have length {1}, was {2}.'.format(collection, expectedLength, collection.length)
    );
  },

  valueIsBlank: function(value) {
    return _.isUndefined(value) || _.isNull(value) || value === '';
  },

  /**
   * Returns the currency name for given locale for formatting a number, defaults to USD
   */
  getCurrency: function(locale) {
    switch (locale) {
      case 'en':
        return 'USD';

      case 'ca':
      case 'es':
      case 'fr':
      case 'it':
      case 'nl':
        return 'EUR';

      case 'zh':
        return 'CNY';

      default:
        return 'USD';
    }
  },

  /**
   * Returns grouping character for given locale for formatting a number, defaults to comma
   */
  getGroupCharacter: function(locale) {
    switch (locale) {
      case 'en':
      case 'zh':
       return ',';

      case 'ca':
      case 'es':
      case 'it':
      case 'nl':
        return '.';

      case 'fr':
        return '\u00A0';

      default:
        if (locale && !!(typeof Intl == 'object' && Intl && typeof Intl.NumberFormat == 'function')) {
          var localized = (1234).toLocaleString(locale);
          var character = localized.match(/1(.*)234/)[1];

          return character;
        }

        return ',';
    }
  },

  /**
   * Returns the decimal character for given locale for formatting a number, defaults to period
   */
  getDecimalCharacter: function(locale) {
    switch (locale) {
      case 'en':
      case 'zh':
       return '.';

      case 'ca':
      case 'es':
      case 'fr':
      case 'it':
      case 'nl':
        return ',';

      default:
        if (locale && !!(typeof Intl == 'object' && Intl && typeof Intl.NumberFormat == 'function')) {
          var localized = (12.34).toLocaleString(locale);
          var character = localized.match(/12(.*)34/)[1];

          return character;
        }

        return '.';
    }
  },

  /**
   * Gets locale from a global object (usually window)
   */
  getLocale: function(global) {
    return !_.isObject(global) ?
      'en' :
      _.get(global.serverConfig, 'locale',
        _.get(global.blist, 'locale',
          _.get(global.socrataConfig, 'locales.currentLocale', 'en')
        )
      );
  },

  /**
   * Gets the user timezone from the browser
   */
  getTimeZone: function() {
    jstz.determine().name()
  },

  /**
   * Returns a human readable version of a number, formatted to 4 characters.
   * options can include a groupCharacter, which defaults to the group character of current locale (comma for en),
   * and a decimalCharacter which defaults to decimal character of current locale (period for en).
   *
   * Example:
   *
   * formatNumber(12345);
   *   => '12.3K'
   */
  formatNumber: function(value, options) {

    if (!_.isNumber(value)) {
      throw new Error('`.formatNumber()` requires numeric input.');
    }

    var locale = utils.getLocale(window);

    var defaultOptions = {
      groupCharacter: utils.getGroupCharacter(locale),
      decimalCharacter: utils.getDecimalCharacter(locale)
    };
    var formatNumberOptions = _.assign({}, defaultOptions, options);

    var val = parseFloat(value);
    var absVal = Math.abs(val);
    var maxLength = 4;
    var newValue;
    var symbolIndex;

    if (absVal < 0.001) {

      return val.toString();

    } else if (absVal < 9999.5) {

      // This branch handles everything that doesn't use a magnitude suffix.
      // Thousands less than 10K are commaified.
      var parts = absVal.toString().split('.').concat('');
      var precision = Math.min(parts[1].length, maxLength - parts[0].length);

      return utils.commaify(val.toFixed(precision), formatNumberOptions);

    } else if (/e/i.test(val)) {

      // This branch handles huge numbers that switch to exponent notation.
      var exponentParts = val.toString().split(/e\+?/i);
      symbolIndex = Math.floor(parseFloat(exponentParts[1]) / 3) - 1;
      newValue = exponentParts[0];

      var shiftAmount = parseFloat(exponentParts[1]) % 3;

      if (shiftAmount > 0) {

        // Adjust from e.g. 1.23e+4 to 12.3K
        newValue = newValue.replace(/^(-?\d+)(\.\d+)?$/, function(match, whole, frac) {

          frac = frac || `${formatNumberOptions.decimalCharacter}000`;

          return `{0}${formatNumberOptions.decimalCharacter}{1}`.format(
            whole + frac.slice(1, 1 + shiftAmount), frac.slice(shiftAmount)
          );
        });
      }

      newValue = parseFloat(Math.abs(newValue)).toFixed(maxLength - shiftAmount - 1);

    } else {

      // This branch handles values that need a magnitude suffix.
      // We use commaify to determine what magnitude we're operating in.
      var magnitudeGroups = utils.commaify(absVal.toFixed(0), formatNumberOptions).
        split(formatNumberOptions.groupCharacter);
      symbolIndex = magnitudeGroups.length - 2;
      newValue = parseFloat(`${magnitudeGroups[0]}.${magnitudeGroups[1]}`);
      newValue = newValue.toFixed(maxLength - magnitudeGroups[0].length - 1);

    }

    // The one edge case to handle is when 999.9[KMB...] rounds up, which
    // bumps us into the next magnitude.
    if (newValue === '1000') {
      newValue = '1';
      symbolIndex++;
    }

    if (!_.isUndefined(NUMBER_FORMATTER_MAGNITUDE_SYMBOLS[symbolIndex])) {

      // {negative?}{value}{magnitude}
      return '{0}{1}{2}'.format(
        val < 0 ? '-' : '',
        parseFloat(newValue).toString().replace('.', formatNumberOptions.decimalCharacter),
        NUMBER_FORMATTER_MAGNITUDE_SYMBOLS[symbolIndex]
      );
    } else {
      return val.toString();
    }
  },

  // Given a number or a string representing a number, returns a string delimited
  // by options.groupCharacter (default , for en locale) that separates digits into groups of 3.
  // The decimal portion will be separated by options.decimalCharacter (default . for en locale).
  commaify: function(value, options) {
    var isNumeric = _.isNumber(value);

    value = String(value);

    var locale = utils.getLocale(window);

    var defaultOptions = {
      groupCharacter: utils.getGroupCharacter(locale),
      decimalCharacter: utils.getDecimalCharacter(locale)
    };

    var commaifyOptions = _.assign({}, defaultOptions, options);

    // If input is numeric, decimal will always be period. Otherwise look for period, comma and default character respectively.
    var periodIndex = value.lastIndexOf('.');
    var commaIndex = value.lastIndexOf(',');
    var nonNumericDecimalCharacter = periodIndex > commaIndex ? '.' : (commaIndex != -1 ? ',' : defaultOptions.decimalCharacter);
    var decimalCharacterToLookFor = isNumeric ? '.' : nonNumericDecimalCharacter;

    var pos = value.indexOf(decimalCharacterToLookFor);

    if (pos === -1) {
      pos = value.length;
    } else {
      value = value.replace(decimalCharacterToLookFor, commaifyOptions.decimalCharacter);
    }

    pos -= 3;

    while (pos > 0 && value.charAt(pos - 1) >= '0' && value.charAt(pos - 1) <= '9') {
      value = value.substring(0, pos) + commaifyOptions.groupCharacter + value.substring(pos);
      pos -= 3;
    }

    return value;
  },

  pluralize: function(str, count) {
    var pluralRules = [
      [new RegExp('(m)an$', 'gi'), '$1en'],
      [new RegExp('(pe)rson$', 'gi'), '$1ople'],
      [new RegExp('(child)$', 'gi'), '$1ren'],
      [new RegExp('^(ox)$', 'gi'), '$1en'],
      [new RegExp('(ax|test)is$', 'gi'), '$1es'],
      [new RegExp('(octop|vir)us$', 'gi'), '$1i'],
      [new RegExp('(alias|status)$', 'gi'), '$1es'],
      [new RegExp('(bu)s$', 'gi'), '$1ses'],
      [new RegExp('(buffal|tomat|potat)o$', 'gi'), '$1oes'],
      [new RegExp('([ti])um$', 'gi'), '$1a'],
      [new RegExp('sis$', 'gi'), 'ses'],
      [new RegExp('(?:([^f])fe|([lr])f)$', 'gi'), '$1$2ves'],
      [new RegExp('(hive)$', 'gi'), '$1s'],
      [new RegExp('([^aeiouy]|qu)y$', 'gi'), '$1ies'],
      [new RegExp('(x|ch|ss|sh)$', 'gi'), '$1es'],
      [new RegExp('(matr|vert|ind)ix|ex$', 'gi'), '$1ices'],
      [new RegExp('([m|l])ouse$', 'gi'), '$1ice'],
      [new RegExp('(quiz)$', 'gi'), '$1zes'],
      [new RegExp('s$', 'gi'), 's'],
      [new RegExp('$', 'gi'), 's']
    ];
    var uncountableWords = [
      'equipment', 'information', 'rice', 'money', 'species', 'series', 'fish',
      'sheep', 'moose', 'deer', 'news', 'sugar', 'butter', 'water',
      'furniture', 'luggage', 'advice', 'information', 'news', 'info', 'music',
      'art', 'love', 'happiness', 'electricity', 'gas', 'power'
    ];
    var lastWord;
    var ignore;

    if (count === 1) {
      return str;
    } else {

      str = str.trim();
      lastWord = _.last(str.split(' '));
      ignore = (uncountableWords.indexOf(lastWord.toLowerCase()) > -1);

      if (!ignore) {

        for (var i = 0; i < pluralRules.length; i++) {

          if (str.match(pluralRules[i][0])) {
            str = str.replace(pluralRules[i][0], pluralRules[i][1]);
            break;
          }
        }
      }

      return str;
    }
  },

  /**
   * Controls page scrolling behavior when inside the given element.
   * If enable is true, isolates scrolling to given element when inside by preventing
   * scrolling from bubbling up to the document. (If outside element, page scrolling
   * behaves as usual).
   * If set to false, disables scrolling isolation, and re-enables page scrolling.
   *
   * @param {jQuery wrapped DOM} $element - the element on which to isolate scrolling behavior
   * @param {boolean} enable - whether to isolate scrolling to element and prevent page scrolling
   */
  isolateScrolling: function($element, enable) {
    window.isolateScrolling$ = $;

    var hasPreventPageScrolling;
    var needToRegister;
    var needToUnregister;

    utils.assertInstanceOf($element, $);
    utils.assert($element.length === 1, '`element` selection must have length 1');
    utils.assertIsOneOfTypes(enable, 'boolean');

    hasPreventPageScrolling = $element[0].hasOwnProperty('preventPageScrolling');

    needToRegister = enable && !hasPreventPageScrolling;
    needToUnregister = !enable && hasPreventPageScrolling;

    if (needToRegister) {
      // Helper to prevent page scrolling when inside the given element
      $element[0].preventPageScrolling = function(e) {

        // Base prevention of page scrolling on scroll status of the given element
        var scrollingElement = $(this);
        var scrollTop = scrollingElement.scrollTop();

        // IE/Chrome/Safari use 'wheelDelta', Firefox uses 'detail'
        var scrollingUp = e.originalEvent.wheelDelta > 0 || e.originalEvent.detail < 0;

        if (scrollingUp) {

          // At top
          if (scrollTop === 0) {
            e.preventDefault();
          }
        } else {
          var innerHeight = scrollingElement.innerHeight();
          var scrollHeight = scrollingElement[0].scrollHeight;


          // At bottom
          if (scrollTop >= scrollHeight - innerHeight) {
            e.preventDefault();
          }
        }
      };

      $element.on(MOUSE_WHEEL_EVENTS, $element[0].preventPageScrolling);
    } else if (needToUnregister) {
      $element.off(MOUSE_WHEEL_EVENTS, $element[0].preventPageScrolling);
      delete $element[0].preventPageScrolling;
    }
  },

  /**
   * Gets the value of a cookie by name.
   *
   * @param {String} cookieName
   */
  getCookie: function(cookieName) {
    var name = cookieName + '=';
    var cookies = document.cookie.split(/;\s*/);

    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i];

      if (cookie.indexOf(name) === 0) {
        return cookie.replace(name, '');
      }
    }
  },

  /**
   * Serializes a Date object into a floating timestamp.
   * NOTE: Untestable due to time zone dependency.
   *
   * @param {Date} date to serialize
   */
  serializeFloatingTimestamp: function(date) {
    function formatToTwoPlaces(value) {
      return (value < 10) ?
        '0' + value.toString() :
        value.toString();
    }

    // The month component of JavaScript dates is 0-indexed
    // (I have no idea why) so when we are serializing a
    // JavaScript date as ISO-8601 date we need to increment
    // the month value.
    return '{0}-{1}-{2}T{3}:{4}:{5}'.format(
      date.getFullYear(),
      formatToTwoPlaces(date.getMonth() + 1),
      formatToTwoPlaces(date.getDate()),
      formatToTwoPlaces(date.getHours()),
      formatToTwoPlaces(date.getMinutes()),
      formatToTwoPlaces(date.getSeconds())
    );
  },

  /**
   * Deserializes an ISO-8601 timestamp to a Date object.
   * NOTE: Untestable due to time zone dependency.
   *
   * @param {String} timestamp to deserialize
   */
  deserializeFloatingTimestamp: function(timestamp) {
    if (timestamp.length < 19 || isNaN(new Date(timestamp).getTime())) {
      throw new Error(
        'Could not parse floating timestamp: "{0}" is not a valid ISO-8601 date.'.
          format(timestamp)
      );
    }

    // The month component of JavaScript dates is 0-indexed
    // (I have no idea why) so when we are deserializing a
    // properly-formatted ISO-8601 date we need to decrement
    // the month value.
    return new Date(
      timestamp.substring(0, 4),
      timestamp.substring(5, 7) - 1,
      timestamp.substring(8, 10),
      timestamp.substring(11, 13),
      timestamp.substring(14, 16),
      timestamp.substring(17, 19)
    );
  },

  /**
   * This function converts a string to a url safe format
   * copied from urlSafe() in util/util.js. There is also
   * a ruby equivalent in string_extensions.rb
   */
  convertToUrlComponent: function(text) {
    var output = text.
      replace(/\s+/g, '-').
      replace(/[^a-zA-Z0-9_\-]/g, '-').
      replace(/\-+/g, '-');
    if (output.length < 1) {
      output = '-';
    }
    return output.slice(0, 50);
  }
};

/* eslint-disable no-extend-native */

// Attach `.format()` and `.escapeSpaces()` to String.prototype.
String.prototype.format = format;
String.prototype.escapeSpaces = escapeSpaces;

/* eslint-enable no-extend-native */

// Add CustomEvent to the window.
CustomEvent.prototype = window.Event.prototype;
window.CustomEvent = CustomEvent;

module.exports = utils;
