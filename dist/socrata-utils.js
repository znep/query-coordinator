(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("jquery"), require("lodash"));
	else if(typeof define === 'function' && define.amd)
		define(["jquery", "lodash"], factory);
	else if(typeof exports === 'object')
		exports["utils"] = factory(require("jquery"), require("lodash"));
	else
		root["socrata"] = root["socrata"] || {}, root["socrata"]["utils"] = factory(root["jquery"], root["lodash"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__, __WEBPACK_EXTERNAL_MODULE_2__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 10);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_2__;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var $ = __webpack_require__(1);

var Analytics = function() {

  var analyticsUrl = '/analytics/add';

  // Default buffer size for
  var queueCapacity = 20;

  // Queue of metrics for consolidation and minimizing outgoing PUT request.
  var queue = [];

  // Whether or not we should send computed metrics to the analytics service backend.
  var serverUploadEnabled = true;

  // Controls whether or not to send computed metrics up to
  // the backend. Defaults to enabled.
  this.setServerUploadEnabled = function(isEnabled) {
    serverUploadEnabled = isEnabled;
  };

  /**
   * Set the size of the metrics buffer.
   *
   * @param size Desired size of the metrics buffer.
   */
  this.setMetricsQueueCapacity = function(size) {
    if (size > 0) {
      queueCapacity = size;
    }
  };

  /**
   * Posts an analytics metric to the analytics endpoint
   * Analytics endpoint performs checking to determine if it is a valid metric.
   *
   * @param {string} entityName
   * @param {string} metricName
   * @param {string} metricValue
   */
  this.sendMetric = function(entityName, metricName, metricValue) {
    queue.push({entity: entityName, metric: metricName, increment: metricValue});
    if (queue.length >= queueCapacity) {
      this.flushMetrics();
    }
  };

  /**
   * Sends any queued metrics
   * async: Whether or not to send the metrics asynchronously. If null or undefined, assumed to be true.
   */
  this.flushMetrics = function(async) {
    var analyticsPayload;

    if (serverUploadEnabled) {
      if (queue.length === 0) {
        return;
      }

      if (async === null || async === undefined) {
        async = true;
      }

      // create the batched payload and reset the queue
      analyticsPayload = JSON.stringify({'metrics': queue});
      queue = [];

      $.ajax({
        url: analyticsUrl,
        type: 'post',
        async: async,
        contentType: 'application/text',
        headers: {
          'X-Socrata-Auth': 'unauthenticated'
        },
        data: analyticsPayload,
        dataType: 'json'
      });
    }
  };

  // We want to flush metrics on unload in case we've queued up some metrics and haven't explicitly flushed.
  window.onbeforeunload = this.flushMetrics(false);
};

module.exports = Analytics;


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _ = __webpack_require__(2);

var FeatureFlags = {
  source: function(key) {
    throw new Error('Reserved for future use (FFS).');
  },

  value: function(key) {
    var featureFlags = _.get(window, 'socrata.featureFlags');
    if (featureFlags === undefined) {
      featureFlags = _.get(window, 'serverConfig.featureFlags');
    }
    if (featureFlags === undefined) {
      throw new Error(
        'FeatureFlags requires window.socrata.featureFlags or window.serverConfig.featureFlags to be defined. Please see README.md in frontend-utils.'
      );
    }
    if (Object.keys(featureFlags).indexOf(key) === -1) {
      throw new Error('Invalid feature flag: ' + key);
    } else {
      return featureFlags[key];
    }
  },

  // Intended usage in tests/specs:
  //   FeatureFlags.useTestFixture({ useAuth0: false });
  //   expect(FeatureFlags.value('useAuth0')).to.equal(false);
  useTestFixture: function(options) {
    window.socrata = window.socrata || {};
    window.socrata.featureFlags = options || {};
  }
};

module.exports = FeatureFlags;


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _ = __webpack_require__(2);
var $ = __webpack_require__(1);

if (typeof window.Promise !== 'function') {
  window.Promise = __webpack_require__(6).Promise;
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

    var assertHasProperty = this.assertHasProperty;

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
    this.assertHasProperty(collection, 'length');
    this.assertIsOneOfTypes(expectedLength, 'number');
    utils.assert(
      collection.length === expectedLength,
      'Expected `{0}` to have length {1}, was {2}.'.format(collection, expectedLength, collection.length)
    );
  },

  valueIsBlank: function(value) {
    return _.isUndefined(value) || _.isNull(value) || value === '';
  },

  /**
   * Returns a human readable version of a number, formatted to 4 characters.
   * options can include a groupCharacter, which defaults to the comma character,
   * and a decimalCharacter which defaults to the period.
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

    var defaultOptions = {
      groupCharacter: ',',
      decimalCharacter: '.'
    };
    var formatNumberOptions = _.assign({}, defaultOptions, options);

    var val = parseFloat(value);
    var absVal = Math.abs(val);
    var maxLength = 4;
    var newValue;
    var symbolIndex;

    if (absVal < .001) {

      return val.toString();

    } else if (absVal < 9999.5) {

      // This branch handles everything that doesn't use a magnitude suffix.
      // Thousands less than 10K are commaified.
      var parts = absVal.toString().split('.').concat('');
      var precision = Math.min(parts[1].length, maxLength - parts[0].length);

      return this.commaify(val.toFixed(precision), formatNumberOptions);

    } else if (/e/i.test(val)) {

      // This branch handles huge numbers that switch to exponent notation.
      var exponentParts = val.toString().split(/e\+?/i);
      symbolIndex = Math.floor(parseFloat(exponentParts[1]) / 3) - 1;
      newValue = exponentParts[0];

      var shiftAmount = parseFloat(exponentParts[1]) % 3;

      if (shiftAmount > 0) {

        // Adjust from e.g. 1.23e+4 to 12.3K
        newValue = newValue.replace(/^(-?\d+)(\.\d+)?$/, function(match, whole, frac) {

          frac = frac || '.000';

          return '{0}.{1}'.format(whole + frac.slice(1, 1 + shiftAmount), frac.slice(shiftAmount));
        });
      }

      newValue = parseFloat(Math.abs(newValue)).toFixed(maxLength - shiftAmount - 1);

    } else {

      // This branch handles values that need a magnitude suffix.
      // We use commaify to determine what magnitude we're operating in.
      var magnitudeGroups = this.commaify(absVal.toFixed(0)).split(',');
      symbolIndex = magnitudeGroups.length - 2;
      newValue = parseFloat(magnitudeGroups[0] + '.' + magnitudeGroups[1]);
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
  // by options.groupCharacter (default ,) that separates digits into groups of 3.
  // The decimal portion will be separated by options.decimalCharacter (default .).
  commaify: function(value, options) {

    value = String(value);

    var defaultOptions = {
      groupCharacter: ',',
      decimalCharacter: '.'
    };

    var commaifyOptions = _.assign({}, defaultOptions, options);

    var pos = value.indexOf(defaultOptions.decimalCharacter);

    if (pos === -1) {
      pos = value.length;
    } else {
      value = value.replace(defaultOptions.decimalCharacter, commaifyOptions.decimalCharacter);
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

    this.assertInstanceOf($element, $);
    this.assert($element.length === 1, '`element` selection must have length 1');
    this.assertIsOneOfTypes(enable, 'boolean');

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
  }
};

if (String.prototype.format && console && console.warn) {
  console.warn('Warning: String.prototype.format was already set somewhere else. It may not function as expected.');
}

/* eslint-disable no-extend-native */

// Attach `.format()` and `.escapeSpaces()` to String.prototype.
String.prototype.format = format;
String.prototype.escapeSpaces = escapeSpaces;

/* eslint-enable no-extend-native */

// Add CustomEvent to the window.
CustomEvent.prototype = window.Event.prototype;
window.CustomEvent = CustomEvent;

module.exports = utils;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global, setImmediate) {var __WEBPACK_AMD_DEFINE_RESULT__;(function(global){

//
// Check for native Promise and it has correct interface
//

var NativePromise = global['Promise'];
var nativePromiseSupported =
  NativePromise &&
  // Some of these methods are missing from
  // Firefox/Chrome experimental implementations
  'resolve' in NativePromise &&
  'reject' in NativePromise &&
  'all' in NativePromise &&
  'race' in NativePromise &&
  // Older version of the spec had a resolver object
  // as the arg rather than a function
  (function(){
    var resolve;
    new NativePromise(function(r){ resolve = r; });
    return typeof resolve === 'function';
  })();


//
// export if necessary
//

if (typeof exports !== 'undefined' && exports)
{
  // node.js
  exports.Promise = nativePromiseSupported ? NativePromise : Promise;
  exports.Polyfill = Promise;
}
else
{
  // AMD
  if (true)
  {
    !(__WEBPACK_AMD_DEFINE_RESULT__ = function(){
      return nativePromiseSupported ? NativePromise : Promise;
    }.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  }
  else
  {
    // in browser add to global
    if (!nativePromiseSupported)
      global['Promise'] = Promise;
  }
}


//
// Polyfill
//

var PENDING = 'pending';
var SEALED = 'sealed';
var FULFILLED = 'fulfilled';
var REJECTED = 'rejected';
var NOOP = function(){};

function isArray(value) {
  return Object.prototype.toString.call(value) === '[object Array]';
}

// async calls
var asyncSetTimer = typeof setImmediate !== 'undefined' ? setImmediate : setTimeout;
var asyncQueue = [];
var asyncTimer;

function asyncFlush(){
  // run promise callbacks
  for (var i = 0; i < asyncQueue.length; i++)
    asyncQueue[i][0](asyncQueue[i][1]);

  // reset async asyncQueue
  asyncQueue = [];
  asyncTimer = false;
}

function asyncCall(callback, arg){
  asyncQueue.push([callback, arg]);

  if (!asyncTimer)
  {
    asyncTimer = true;
    asyncSetTimer(asyncFlush, 0);
  }
}


function invokeResolver(resolver, promise) {
  function resolvePromise(value) {
    resolve(promise, value);
  }

  function rejectPromise(reason) {
    reject(promise, reason);
  }

  try {
    resolver(resolvePromise, rejectPromise);
  } catch(e) {
    rejectPromise(e);
  }
}

function invokeCallback(subscriber){
  var owner = subscriber.owner;
  var settled = owner.state_;
  var value = owner.data_;  
  var callback = subscriber[settled];
  var promise = subscriber.then;

  if (typeof callback === 'function')
  {
    settled = FULFILLED;
    try {
      value = callback(value);
    } catch(e) {
      reject(promise, e);
    }
  }

  if (!handleThenable(promise, value))
  {
    if (settled === FULFILLED)
      resolve(promise, value);

    if (settled === REJECTED)
      reject(promise, value);
  }
}

function handleThenable(promise, value) {
  var resolved;

  try {
    if (promise === value)
      throw new TypeError('A promises callback cannot return that same promise.');

    if (value && (typeof value === 'function' || typeof value === 'object'))
    {
      var then = value.then;  // then should be retrived only once

      if (typeof then === 'function')
      {
        then.call(value, function(val){
          if (!resolved)
          {
            resolved = true;

            if (value !== val)
              resolve(promise, val);
            else
              fulfill(promise, val);
          }
        }, function(reason){
          if (!resolved)
          {
            resolved = true;

            reject(promise, reason);
          }
        });

        return true;
      }
    }
  } catch (e) {
    if (!resolved)
      reject(promise, e);

    return true;
  }

  return false;
}

function resolve(promise, value){
  if (promise === value || !handleThenable(promise, value))
    fulfill(promise, value);
}

function fulfill(promise, value){
  if (promise.state_ === PENDING)
  {
    promise.state_ = SEALED;
    promise.data_ = value;

    asyncCall(publishFulfillment, promise);
  }
}

function reject(promise, reason){
  if (promise.state_ === PENDING)
  {
    promise.state_ = SEALED;
    promise.data_ = reason;

    asyncCall(publishRejection, promise);
  }
}

function publish(promise) {
  var callbacks = promise.then_;
  promise.then_ = undefined;

  for (var i = 0; i < callbacks.length; i++) {
    invokeCallback(callbacks[i]);
  }
}

function publishFulfillment(promise){
  promise.state_ = FULFILLED;
  publish(promise);
}

function publishRejection(promise){
  promise.state_ = REJECTED;
  publish(promise);
}

/**
* @class
*/
function Promise(resolver){
  if (typeof resolver !== 'function')
    throw new TypeError('Promise constructor takes a function argument');

  if (this instanceof Promise === false)
    throw new TypeError('Failed to construct \'Promise\': Please use the \'new\' operator, this object constructor cannot be called as a function.');

  this.then_ = [];

  invokeResolver(resolver, this);
}

Promise.prototype = {
  constructor: Promise,

  state_: PENDING,
  then_: null,
  data_: undefined,

  then: function(onFulfillment, onRejection){
    var subscriber = {
      owner: this,
      then: new this.constructor(NOOP),
      fulfilled: onFulfillment,
      rejected: onRejection
    };

    if (this.state_ === FULFILLED || this.state_ === REJECTED)
    {
      // already resolved, call callback async
      asyncCall(invokeCallback, subscriber);
    }
    else
    {
      // subscribe
      this.then_.push(subscriber);
    }

    return subscriber.then;
  },

  'catch': function(onRejection) {
    return this.then(null, onRejection);
  }
};

Promise.all = function(promises){
  var Class = this;

  if (!isArray(promises))
    throw new TypeError('You must pass an array to Promise.all().');

  return new Class(function(resolve, reject){
    var results = [];
    var remaining = 0;

    function resolver(index){
      remaining++;
      return function(value){
        results[index] = value;
        if (!--remaining)
          resolve(results);
      };
    }

    for (var i = 0, promise; i < promises.length; i++)
    {
      promise = promises[i];

      if (promise && typeof promise.then === 'function')
        promise.then(resolver(i), reject);
      else
        results[i] = promise;
    }

    if (!remaining)
      resolve(results);
  });
};

Promise.race = function(promises){
  var Class = this;

  if (!isArray(promises))
    throw new TypeError('You must pass an array to Promise.race().');

  return new Class(function(resolve, reject) {
    for (var i = 0, promise; i < promises.length; i++)
    {
      promise = promises[i];

      if (promise && typeof promise.then === 'function')
        promise.then(resolve, reject);
      else
        resolve(promise);
    }
  });
};

Promise.resolve = function(value){
  var Class = this;

  if (value && typeof value === 'object' && value.constructor === Class)
    return value;

  return new Class(function(resolve){
    resolve(value);
  });
};

Promise.reject = function(reason){
  var Class = this;

  return new Class(function(resolve, reject){
    reject(reason);
  });
};

})(typeof window != 'undefined' ? window : typeof global != 'undefined' ? global : typeof self != 'undefined' ? self : this);

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(0), __webpack_require__(9).setImmediate))

/***/ }),
/* 7 */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global, process) {(function (global, undefined) {
    "use strict";

    if (global.setImmediate) {
        return;
    }

    var nextHandle = 1; // Spec says greater than zero
    var tasksByHandle = {};
    var currentlyRunningATask = false;
    var doc = global.document;
    var registerImmediate;

    function setImmediate(callback) {
      // Callback can either be a function or a string
      if (typeof callback !== "function") {
        callback = new Function("" + callback);
      }
      // Copy function arguments
      var args = new Array(arguments.length - 1);
      for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i + 1];
      }
      // Store and register the task
      var task = { callback: callback, args: args };
      tasksByHandle[nextHandle] = task;
      registerImmediate(nextHandle);
      return nextHandle++;
    }

    function clearImmediate(handle) {
        delete tasksByHandle[handle];
    }

    function run(task) {
        var callback = task.callback;
        var args = task.args;
        switch (args.length) {
        case 0:
            callback();
            break;
        case 1:
            callback(args[0]);
            break;
        case 2:
            callback(args[0], args[1]);
            break;
        case 3:
            callback(args[0], args[1], args[2]);
            break;
        default:
            callback.apply(undefined, args);
            break;
        }
    }

    function runIfPresent(handle) {
        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
        // So if we're currently running a task, we'll need to delay this invocation.
        if (currentlyRunningATask) {
            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
            // "too much recursion" error.
            setTimeout(runIfPresent, 0, handle);
        } else {
            var task = tasksByHandle[handle];
            if (task) {
                currentlyRunningATask = true;
                try {
                    run(task);
                } finally {
                    clearImmediate(handle);
                    currentlyRunningATask = false;
                }
            }
        }
    }

    function installNextTickImplementation() {
        registerImmediate = function(handle) {
            process.nextTick(function () { runIfPresent(handle); });
        };
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        if (global.postMessage && !global.importScripts) {
            var postMessageIsAsynchronous = true;
            var oldOnMessage = global.onmessage;
            global.onmessage = function() {
                postMessageIsAsynchronous = false;
            };
            global.postMessage("", "*");
            global.onmessage = oldOnMessage;
            return postMessageIsAsynchronous;
        }
    }

    function installPostMessageImplementation() {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
            if (event.source === global &&
                typeof event.data === "string" &&
                event.data.indexOf(messagePrefix) === 0) {
                runIfPresent(+event.data.slice(messagePrefix.length));
            }
        };

        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        registerImmediate = function(handle) {
            global.postMessage(messagePrefix + handle, "*");
        };
    }

    function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
            var handle = event.data;
            runIfPresent(handle);
        };

        registerImmediate = function(handle) {
            channel.port2.postMessage(handle);
        };
    }

    function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        registerImmediate = function(handle) {
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var script = doc.createElement("script");
            script.onreadystatechange = function () {
                runIfPresent(handle);
                script.onreadystatechange = null;
                html.removeChild(script);
                script = null;
            };
            html.appendChild(script);
        };
    }

    function installSetTimeoutImplementation() {
        registerImmediate = function(handle) {
            setTimeout(runIfPresent, 0, handle);
        };
    }

    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

    // Don't get fooled by e.g. browserify environments.
    if ({}.toString.call(global.process) === "[object process]") {
        // For Node.js before 0.9
        installNextTickImplementation();

    } else if (canUsePostMessage()) {
        // For non-IE10 modern browsers
        installPostMessageImplementation();

    } else if (global.MessageChannel) {
        // For web workers, where supported
        installMessageChannelImplementation();

    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        // For IE 6–8
        installReadyStateChangeImplementation();

    } else {
        // For older browsers
        installSetTimeoutImplementation();
    }

    attachTo.setImmediate = setImmediate;
    attachTo.clearImmediate = clearImmediate;
}(typeof self === "undefined" ? typeof global === "undefined" ? this : global : self));

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(0), __webpack_require__(7)))

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

var apply = Function.prototype.apply;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) {
  if (timeout) {
    timeout.close();
  }
};

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// setimmediate attaches itself to the global object
__webpack_require__(8);
exports.setImmediate = setImmediate;
exports.clearImmediate = clearImmediate;


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

var utils = __webpack_require__(5);
var Analytics = __webpack_require__(3);
var FeatureFlags = __webpack_require__(4);

utils.Analytics = Analytics;
utils.FeatureFlags = FeatureFlags;

module.exports = utils;


/***/ })
/******/ ]);
});
//# sourceMappingURL=socrata-utils.js.map