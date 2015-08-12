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
     * Prevents scrolling from bubbling up to the document
     * Ex: element.on('mousewheel', '.scrollable', Util.preventScrolling)
     */
    preventScrolling: function(e) {
      // Base prevention of page scrolling on scroll status of the element
      // specified by the given selector (passed as a second argument to
      // element.on() invocation above and represented here as $(this)).
      var scrollEnabledElement = $(this);
      var scrollTop = scrollEnabledElement.scrollTop();

      var delta = e.originalEvent.deltaY;
      if (delta < 0) {
        // Scrolling up.
        if (scrollTop === 0) {
          // Past top.
          e.preventDefault();
        }
      } else if (delta > 0) {
        // Scrolling down.
        var innerHeight = scrollEnabledElement.innerHeight();
        var scrollHeight = scrollEnabledElement[0].scrollHeight;

        if (scrollTop >= scrollHeight - innerHeight) {
          // Past bottom.
          e.preventDefault();
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
})(window);
