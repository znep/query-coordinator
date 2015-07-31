(function(window) {

  if (
    (!window._) ||
    (_.prototype.constructor.toString().match(/lodash/i) === null)
  ) {
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

  var socrataUtils = {

    assertEqual: function(value1, value2) {

      if (value1 !== value2) {
        throw new Error(
          'Value `' + value1 + '` must equal value `' + value2 + '`.'
        );
      }
    },

    assertHasProperty: function(object, name, message) {

      if (!_.has(object, name)) {

        if (message) {
          throw new Error(message);
        }

        throw new Error(
          '`' +
          name +
          '`' +
          ' property must be present. Object has properties: [' +
          Object.keys(object).join(', ') +
          '].'
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
          'Value must be one of [' +
          types.join(', ') +
          '] (is of type ' +
          (typeof value) +
          ').'
        );
      }
    }
  };

  String.prototype.format = format;

  _.merge(window.socrata.utils, socrataUtils);
})(window);
