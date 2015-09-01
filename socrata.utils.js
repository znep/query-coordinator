(function(window) {

  if (typeof window._ !== 'function') {
    throw new Error('lodash is a required dependency for `socrata-utils.js`.');
  }

  if (String.prototype.format) {
    throw new Error(
      'Cannot assign format function to String prototype: ' +
      '`String.prototype.format` already exists.'
    );
  }

  window.socrata = window.socrata || {};
  window.socrata.utils = window.socrata.utils || {};

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
  var formatWithObject = function(objectMaybe) {

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

    var customEventParams = _.merge(
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

  var socrataUtils = {

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
        _.rest(arguments),
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

      var types = _.rest(arguments);
      var valid = _.contains(types, typeof value);

      if (!valid) {
        throw new Error(
          'Value must be one of [{0}] (is of type {1}).'.
            format(types.join(', '), (typeof value))
        );
      }
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
        var newValue = val.toFixed(precision).replace('.', formatNumberOptions.decimalCharacter);

        return this.commaify(newValue, _.pick(formatNumberOptions, 'groupCharacter', 'decimalCharacter'));

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

      this.assert(false, 'Call to `.formatNumber()` was not handled by any format branch.');
    },

    // Given a number or a string representing a number, returns a string delimited
    // by the groupCharacter that separates digits into groups of 3. If the input
    // is a string and uses a non-period character for the decimal, it may be
    // specified by using the decimalCharacter.
    commaify: function(value, options) {

      value = String(value);

      var defaultOptions = {
        groupCharacter: ',',
        decimalCharacter: '.'
      };

      var commaifyOptions = _.assign({}, defaultOptions, options);

      var pos = value.indexOf(commaifyOptions.decimalCharacter);

      if (pos === -1) {
        pos = value.length;
      }

      pos -= 3;

      while (pos > 0 && value.charAt(pos - 1) >= '0' && value.charAt(pos - 1) <= '9') {
        value = value.substring(0, pos) + commaifyOptions.groupCharacter + value.substring(pos);
        pos -= 3;
      }

      return value;
    },

    /**
     * Controls page scrolling behavior when inside the given element.
     * If enable is true, isolates scrolling to given element when inside by preventing
     * scrolling from bubbling up to the document. (If outside element, page scrolling
     * behaves as usual).
     * If set to false, disables scrolling isolation, and re-enables page scrolling.
     *
     * @param {jQuery wrapped DOM element} the element on which to isolate scrolling behavior
     * @param {boolean} whether to isolate scrolling to element and prevent page scrolling
     */
    isolateScrolling: function(element, enable) {

      if (enable) {

        // Helper to prevent page scrolling when inside the given element
        element[0].preventPageScrolling = function(e) {

          // Base prevention of page scrolling on scroll status of the given element
          var scrollingElement = $(this);
          var scrollTop = scrollingElement.scrollTop();

          // IE/Chrome/Safari use 'wheelDelta', Firefox uses 'detail'
          var scrollingUp = e.originalEvent.wheelDeltaY > 0 || e.originalEvent.detail < 0;

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

        element.on(MOUSE_WHEEL_EVENTS, element[0].preventPageScrolling);

      } else {
        if (element[0].hasOwnProperty('preventPageScrolling')) {
          element.off(MOUSE_WHEEL_EVENTS, element[0].preventPageScrolling);
        }
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

      for(var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];

        if (cookie.indexOf(name) === 0) {
          return cookie.replace(name, '');
        }
      }
    }
  };

  // Attach `.format()` and `.escapeSpaces()` to String.prototype.
  String.prototype.format = format;
  String.prototype.escapeSpaces = escapeSpaces;

  // Add CustomEvent to the window.
  CustomEvent.prototype = window.Event.prototype;
  window.CustomEvent = CustomEvent;

  // Decorate `window.socrata.utils` with basic utility functions.
  _.merge(window.socrata.utils, socrataUtils);

  // ES6 Promise polyfill
  // See: https://github.com/jakearchibald/es6-promise/blob/master/dist/es6-promise.min.js
  /*!
   * @overview es6-promise - a tiny implementation of Promises/A+.
   * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
   * @license   Licensed under MIT license
   *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
   * @version   3.0.2
   */

  (function(){"use strict";function lib$es6$promise$utils$$objectOrFunction(x){return typeof x==="function"||typeof x==="object"&&x!==null}function lib$es6$promise$utils$$isFunction(x){return typeof x==="function"}function lib$es6$promise$utils$$isMaybeThenable(x){return typeof x==="object"&&x!==null}var lib$es6$promise$utils$$_isArray;if(!Array.isArray){lib$es6$promise$utils$$_isArray=function(x){return Object.prototype.toString.call(x)==="[object Array]"}}else{lib$es6$promise$utils$$_isArray=Array.isArray}var lib$es6$promise$utils$$isArray=lib$es6$promise$utils$$_isArray;var lib$es6$promise$asap$$len=0;var lib$es6$promise$asap$$toString={}.toString;var lib$es6$promise$asap$$vertxNext;var lib$es6$promise$asap$$customSchedulerFn;var lib$es6$promise$asap$$asap=function asap(callback,arg){lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len]=callback;lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len+1]=arg;lib$es6$promise$asap$$len+=2;if(lib$es6$promise$asap$$len===2){if(lib$es6$promise$asap$$customSchedulerFn){lib$es6$promise$asap$$customSchedulerFn(lib$es6$promise$asap$$flush)}else{lib$es6$promise$asap$$scheduleFlush()}}};function lib$es6$promise$asap$$setScheduler(scheduleFn){lib$es6$promise$asap$$customSchedulerFn=scheduleFn}function lib$es6$promise$asap$$setAsap(asapFn){lib$es6$promise$asap$$asap=asapFn}var lib$es6$promise$asap$$browserWindow=typeof window!=="undefined"?window:undefined;var lib$es6$promise$asap$$browserGlobal=lib$es6$promise$asap$$browserWindow||{};var lib$es6$promise$asap$$BrowserMutationObserver=lib$es6$promise$asap$$browserGlobal.MutationObserver||lib$es6$promise$asap$$browserGlobal.WebKitMutationObserver;var lib$es6$promise$asap$$isNode=typeof process!=="undefined"&&{}.toString.call(process)==="[object process]";var lib$es6$promise$asap$$isWorker=typeof Uint8ClampedArray!=="undefined"&&typeof importScripts!=="undefined"&&typeof MessageChannel!=="undefined";function lib$es6$promise$asap$$useNextTick(){return function(){process.nextTick(lib$es6$promise$asap$$flush)}}function lib$es6$promise$asap$$useVertxTimer(){return function(){lib$es6$promise$asap$$vertxNext(lib$es6$promise$asap$$flush)}}function lib$es6$promise$asap$$useMutationObserver(){var iterations=0;var observer=new lib$es6$promise$asap$$BrowserMutationObserver(lib$es6$promise$asap$$flush);var node=document.createTextNode("");observer.observe(node,{characterData:true});return function(){node.data=iterations=++iterations%2}}function lib$es6$promise$asap$$useMessageChannel(){var channel=new MessageChannel;channel.port1.onmessage=lib$es6$promise$asap$$flush;return function(){channel.port2.postMessage(0)}}function lib$es6$promise$asap$$useSetTimeout(){return function(){setTimeout(lib$es6$promise$asap$$flush,1)}}var lib$es6$promise$asap$$queue=new Array(1e3);function lib$es6$promise$asap$$flush(){for(var i=0;i<lib$es6$promise$asap$$len;i+=2){var callback=lib$es6$promise$asap$$queue[i];var arg=lib$es6$promise$asap$$queue[i+1];callback(arg);lib$es6$promise$asap$$queue[i]=undefined;lib$es6$promise$asap$$queue[i+1]=undefined}lib$es6$promise$asap$$len=0}function lib$es6$promise$asap$$attemptVertx(){try{var r=require;var vertx=r("vertx");lib$es6$promise$asap$$vertxNext=vertx.runOnLoop||vertx.runOnContext;return lib$es6$promise$asap$$useVertxTimer()}catch(e){return lib$es6$promise$asap$$useSetTimeout()}}var lib$es6$promise$asap$$scheduleFlush;if(lib$es6$promise$asap$$isNode){lib$es6$promise$asap$$scheduleFlush=lib$es6$promise$asap$$useNextTick()}else if(lib$es6$promise$asap$$BrowserMutationObserver){lib$es6$promise$asap$$scheduleFlush=lib$es6$promise$asap$$useMutationObserver()}else if(lib$es6$promise$asap$$isWorker){lib$es6$promise$asap$$scheduleFlush=lib$es6$promise$asap$$useMessageChannel()}else if(lib$es6$promise$asap$$browserWindow===undefined&&typeof require==="function"){lib$es6$promise$asap$$scheduleFlush=lib$es6$promise$asap$$attemptVertx()}else{lib$es6$promise$asap$$scheduleFlush=lib$es6$promise$asap$$useSetTimeout()}function lib$es6$promise$$internal$$noop(){}var lib$es6$promise$$internal$$PENDING=void 0;var lib$es6$promise$$internal$$FULFILLED=1;var lib$es6$promise$$internal$$REJECTED=2;var lib$es6$promise$$internal$$GET_THEN_ERROR=new lib$es6$promise$$internal$$ErrorObject;function lib$es6$promise$$internal$$selfFulfillment(){return new TypeError("You cannot resolve a promise with itself")}function lib$es6$promise$$internal$$cannotReturnOwn(){return new TypeError("A promises callback cannot return that same promise.")}function lib$es6$promise$$internal$$getThen(promise){try{return promise.then}catch(error){lib$es6$promise$$internal$$GET_THEN_ERROR.error=error;return lib$es6$promise$$internal$$GET_THEN_ERROR}}function lib$es6$promise$$internal$$tryThen(then,value,fulfillmentHandler,rejectionHandler){try{then.call(value,fulfillmentHandler,rejectionHandler)}catch(e){return e}}function lib$es6$promise$$internal$$handleForeignThenable(promise,thenable,then){lib$es6$promise$asap$$asap(function(promise){var sealed=false;var error=lib$es6$promise$$internal$$tryThen(then,thenable,function(value){if(sealed){return}sealed=true;if(thenable!==value){lib$es6$promise$$internal$$resolve(promise,value)}else{lib$es6$promise$$internal$$fulfill(promise,value)}},function(reason){if(sealed){return}sealed=true;lib$es6$promise$$internal$$reject(promise,reason)},"Settle: "+(promise._label||" unknown promise"));if(!sealed&&error){sealed=true;lib$es6$promise$$internal$$reject(promise,error)}},promise)}function lib$es6$promise$$internal$$handleOwnThenable(promise,thenable){if(thenable._state===lib$es6$promise$$internal$$FULFILLED){lib$es6$promise$$internal$$fulfill(promise,thenable._result)}else if(thenable._state===lib$es6$promise$$internal$$REJECTED){lib$es6$promise$$internal$$reject(promise,thenable._result)}else{lib$es6$promise$$internal$$subscribe(thenable,undefined,function(value){lib$es6$promise$$internal$$resolve(promise,value)},function(reason){lib$es6$promise$$internal$$reject(promise,reason)})}}function lib$es6$promise$$internal$$handleMaybeThenable(promise,maybeThenable){if(maybeThenable.constructor===promise.constructor){lib$es6$promise$$internal$$handleOwnThenable(promise,maybeThenable)}else{var then=lib$es6$promise$$internal$$getThen(maybeThenable);if(then===lib$es6$promise$$internal$$GET_THEN_ERROR){lib$es6$promise$$internal$$reject(promise,lib$es6$promise$$internal$$GET_THEN_ERROR.error)}else if(then===undefined){lib$es6$promise$$internal$$fulfill(promise,maybeThenable)}else if(lib$es6$promise$utils$$isFunction(then)){lib$es6$promise$$internal$$handleForeignThenable(promise,maybeThenable,then)}else{lib$es6$promise$$internal$$fulfill(promise,maybeThenable)}}}function lib$es6$promise$$internal$$resolve(promise,value){if(promise===value){lib$es6$promise$$internal$$reject(promise,lib$es6$promise$$internal$$selfFulfillment())}else if(lib$es6$promise$utils$$objectOrFunction(value)){lib$es6$promise$$internal$$handleMaybeThenable(promise,value)}else{lib$es6$promise$$internal$$fulfill(promise,value)}}function lib$es6$promise$$internal$$publishRejection(promise){if(promise._onerror){promise._onerror(promise._result)}lib$es6$promise$$internal$$publish(promise)}function lib$es6$promise$$internal$$fulfill(promise,value){if(promise._state!==lib$es6$promise$$internal$$PENDING){return}promise._result=value;promise._state=lib$es6$promise$$internal$$FULFILLED;if(promise._subscribers.length!==0){lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish,promise)}}function lib$es6$promise$$internal$$reject(promise,reason){if(promise._state!==lib$es6$promise$$internal$$PENDING){return}promise._state=lib$es6$promise$$internal$$REJECTED;promise._result=reason;lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publishRejection,promise)}function lib$es6$promise$$internal$$subscribe(parent,child,onFulfillment,onRejection){var subscribers=parent._subscribers;var length=subscribers.length;parent._onerror=null;subscribers[length]=child;subscribers[length+lib$es6$promise$$internal$$FULFILLED]=onFulfillment;subscribers[length+lib$es6$promise$$internal$$REJECTED]=onRejection;if(length===0&&parent._state){lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish,parent)}}function lib$es6$promise$$internal$$publish(promise){var subscribers=promise._subscribers;var settled=promise._state;if(subscribers.length===0){return}var child,callback,detail=promise._result;for(var i=0;i<subscribers.length;i+=3){child=subscribers[i];callback=subscribers[i+settled];if(child){lib$es6$promise$$internal$$invokeCallback(settled,child,callback,detail)}else{callback(detail)}}promise._subscribers.length=0}function lib$es6$promise$$internal$$ErrorObject(){this.error=null}var lib$es6$promise$$internal$$TRY_CATCH_ERROR=new lib$es6$promise$$internal$$ErrorObject;function lib$es6$promise$$internal$$tryCatch(callback,detail){try{return callback(detail)}catch(e){lib$es6$promise$$internal$$TRY_CATCH_ERROR.error=e;return lib$es6$promise$$internal$$TRY_CATCH_ERROR}}function lib$es6$promise$$internal$$invokeCallback(settled,promise,callback,detail){var hasCallback=lib$es6$promise$utils$$isFunction(callback),value,error,succeeded,failed;if(hasCallback){value=lib$es6$promise$$internal$$tryCatch(callback,detail);if(value===lib$es6$promise$$internal$$TRY_CATCH_ERROR){failed=true;error=value.error;value=null}else{succeeded=true}if(promise===value){lib$es6$promise$$internal$$reject(promise,lib$es6$promise$$internal$$cannotReturnOwn());return}}else{value=detail;succeeded=true}if(promise._state!==lib$es6$promise$$internal$$PENDING){}else if(hasCallback&&succeeded){lib$es6$promise$$internal$$resolve(promise,value)}else if(failed){lib$es6$promise$$internal$$reject(promise,error)}else if(settled===lib$es6$promise$$internal$$FULFILLED){lib$es6$promise$$internal$$fulfill(promise,value)}else if(settled===lib$es6$promise$$internal$$REJECTED){lib$es6$promise$$internal$$reject(promise,value)}}function lib$es6$promise$$internal$$initializePromise(promise,resolver){try{resolver(function resolvePromise(value){lib$es6$promise$$internal$$resolve(promise,value)},function rejectPromise(reason){lib$es6$promise$$internal$$reject(promise,reason)})}catch(e){lib$es6$promise$$internal$$reject(promise,e)}}function lib$es6$promise$enumerator$$Enumerator(Constructor,input){var enumerator=this;enumerator._instanceConstructor=Constructor;enumerator.promise=new Constructor(lib$es6$promise$$internal$$noop);if(enumerator._validateInput(input)){enumerator._input=input;enumerator.length=input.length;enumerator._remaining=input.length;enumerator._init();if(enumerator.length===0){lib$es6$promise$$internal$$fulfill(enumerator.promise,enumerator._result)}else{enumerator.length=enumerator.length||0;enumerator._enumerate();if(enumerator._remaining===0){lib$es6$promise$$internal$$fulfill(enumerator.promise,enumerator._result)}}}else{lib$es6$promise$$internal$$reject(enumerator.promise,enumerator._validationError())}}lib$es6$promise$enumerator$$Enumerator.prototype._validateInput=function(input){return lib$es6$promise$utils$$isArray(input)};lib$es6$promise$enumerator$$Enumerator.prototype._validationError=function(){return new Error("Array Methods must be provided an Array")};lib$es6$promise$enumerator$$Enumerator.prototype._init=function(){this._result=new Array(this.length)};var lib$es6$promise$enumerator$$default=lib$es6$promise$enumerator$$Enumerator;lib$es6$promise$enumerator$$Enumerator.prototype._enumerate=function(){var enumerator=this;var length=enumerator.length;var promise=enumerator.promise;var input=enumerator._input;for(var i=0;promise._state===lib$es6$promise$$internal$$PENDING&&i<length;i++){enumerator._eachEntry(input[i],i)}};lib$es6$promise$enumerator$$Enumerator.prototype._eachEntry=function(entry,i){var enumerator=this;var c=enumerator._instanceConstructor;if(lib$es6$promise$utils$$isMaybeThenable(entry)){if(entry.constructor===c&&entry._state!==lib$es6$promise$$internal$$PENDING){entry._onerror=null;enumerator._settledAt(entry._state,i,entry._result)}else{enumerator._willSettleAt(c.resolve(entry),i)}}else{enumerator._remaining--;enumerator._result[i]=entry}};lib$es6$promise$enumerator$$Enumerator.prototype._settledAt=function(state,i,value){var enumerator=this;var promise=enumerator.promise;if(promise._state===lib$es6$promise$$internal$$PENDING){enumerator._remaining--;if(state===lib$es6$promise$$internal$$REJECTED){lib$es6$promise$$internal$$reject(promise,value)}else{enumerator._result[i]=value}}if(enumerator._remaining===0){lib$es6$promise$$internal$$fulfill(promise,enumerator._result)}};lib$es6$promise$enumerator$$Enumerator.prototype._willSettleAt=function(promise,i){var enumerator=this;lib$es6$promise$$internal$$subscribe(promise,undefined,function(value){enumerator._settledAt(lib$es6$promise$$internal$$FULFILLED,i,value)},function(reason){enumerator._settledAt(lib$es6$promise$$internal$$REJECTED,i,reason)})};function lib$es6$promise$promise$all$$all(entries){return new lib$es6$promise$enumerator$$default(this,entries).promise}var lib$es6$promise$promise$all$$default=lib$es6$promise$promise$all$$all;function lib$es6$promise$promise$race$$race(entries){var Constructor=this;var promise=new Constructor(lib$es6$promise$$internal$$noop);if(!lib$es6$promise$utils$$isArray(entries)){lib$es6$promise$$internal$$reject(promise,new TypeError("You must pass an array to race."));return promise}var length=entries.length;function onFulfillment(value){lib$es6$promise$$internal$$resolve(promise,value)}function onRejection(reason){lib$es6$promise$$internal$$reject(promise,reason)}for(var i=0;promise._state===lib$es6$promise$$internal$$PENDING&&i<length;i++){lib$es6$promise$$internal$$subscribe(Constructor.resolve(entries[i]),undefined,onFulfillment,onRejection)}return promise}var lib$es6$promise$promise$race$$default=lib$es6$promise$promise$race$$race;function lib$es6$promise$promise$resolve$$resolve(object){var Constructor=this;if(object&&typeof object==="object"&&object.constructor===Constructor){return object}var promise=new Constructor(lib$es6$promise$$internal$$noop);lib$es6$promise$$internal$$resolve(promise,object);return promise}var lib$es6$promise$promise$resolve$$default=lib$es6$promise$promise$resolve$$resolve;function lib$es6$promise$promise$reject$$reject(reason){var Constructor=this;var promise=new Constructor(lib$es6$promise$$internal$$noop);lib$es6$promise$$internal$$reject(promise,reason);return promise}var lib$es6$promise$promise$reject$$default=lib$es6$promise$promise$reject$$reject;var lib$es6$promise$promise$$counter=0;function lib$es6$promise$promise$$needsResolver(){throw new TypeError("You must pass a resolver function as the first argument to the promise constructor")}function lib$es6$promise$promise$$needsNew(){throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.")}var lib$es6$promise$promise$$default=lib$es6$promise$promise$$Promise;function lib$es6$promise$promise$$Promise(resolver){this._id=lib$es6$promise$promise$$counter++;this._state=undefined;this._result=undefined;this._subscribers=[];if(lib$es6$promise$$internal$$noop!==resolver){if(!lib$es6$promise$utils$$isFunction(resolver)){lib$es6$promise$promise$$needsResolver()}if(!(this instanceof lib$es6$promise$promise$$Promise)){lib$es6$promise$promise$$needsNew()}lib$es6$promise$$internal$$initializePromise(this,resolver)}}lib$es6$promise$promise$$Promise.all=lib$es6$promise$promise$all$$default;lib$es6$promise$promise$$Promise.race=lib$es6$promise$promise$race$$default;lib$es6$promise$promise$$Promise.resolve=lib$es6$promise$promise$resolve$$default;lib$es6$promise$promise$$Promise.reject=lib$es6$promise$promise$reject$$default;lib$es6$promise$promise$$Promise._setScheduler=lib$es6$promise$asap$$setScheduler;lib$es6$promise$promise$$Promise._setAsap=lib$es6$promise$asap$$setAsap;lib$es6$promise$promise$$Promise._asap=lib$es6$promise$asap$$asap;lib$es6$promise$promise$$Promise.prototype={constructor:lib$es6$promise$promise$$Promise,then:function(onFulfillment,onRejection){var parent=this;var state=parent._state;if(state===lib$es6$promise$$internal$$FULFILLED&&!onFulfillment||state===lib$es6$promise$$internal$$REJECTED&&!onRejection){return this}var child=new this.constructor(lib$es6$promise$$internal$$noop);var result=parent._result;if(state){var callback=arguments[state-1];lib$es6$promise$asap$$asap(function(){lib$es6$promise$$internal$$invokeCallback(state,child,callback,result)})}else{lib$es6$promise$$internal$$subscribe(parent,child,onFulfillment,onRejection)}return child},"catch":function(onRejection){return this.then(null,onRejection)}};function lib$es6$promise$polyfill$$polyfill(){var local;if(typeof global!=="undefined"){local=global}else if(typeof self!=="undefined"){local=self}else{try{local=Function("return this")()}catch(e){throw new Error("polyfill failed because global object is unavailable in this environment")}}var P=local.Promise;if(P&&Object.prototype.toString.call(P.resolve())==="[object Promise]"&&!P.cast){return}local.Promise=lib$es6$promise$promise$$default}var lib$es6$promise$polyfill$$default=lib$es6$promise$polyfill$$polyfill;var lib$es6$promise$umd$$ES6Promise={Promise:lib$es6$promise$promise$$default,polyfill:lib$es6$promise$polyfill$$default};if(typeof define==="function"&&define["amd"]){define(function(){return lib$es6$promise$umd$$ES6Promise})}else if(typeof module!=="undefined"&&module["exports"]){module["exports"]=lib$es6$promise$umd$$ES6Promise}else if(typeof this!=="undefined"){this["ES6Promise"]=lib$es6$promise$umd$$ES6Promise}lib$es6$promise$polyfill$$default()}).call(this);
})(window);
