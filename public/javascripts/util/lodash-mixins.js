_.mixin({
  isPresent: function(object) {
    if (_.isBoolean(object)) {
      return true;
    } else if (_.isNumber(object)) {
      // Just cast the number to a boolean.
      // If it's 0, we don't consider it 'present'
      // If it's NaN, we also don't consider it 'present'
      return !!object;
    } else {
      return !_.isEmpty(object);
    }
  },
  hasValue: function(value) {
    return value !== null && value !== undefined;
  },
  instead: function(value, insteadValue) {
    return _.isPresent(value) ? value : insteadValue;
  },
  otherwise: _.instead,
  /**
   * @param {Function} f the function to run.
   * @return {Function} a function that will call the given function in the next frame.
   */
  deferred: function(f) {
    return function() {
      _.defer(f);
    };
  },
  /**
   * @return {Number} the log, base 10, of the given number.
   */
  log10: Math.log10 || function(n) {
    return Math.log(n) / Math.LN10;
  },
  /**
   * Wraps the value in an JavaScript object with the given key
   * @param {*} value
   * @param {String} key
   * @returns {{}}
   */
  objectify: function(value, key) {
    var newObject = {};
    newObject[key] = value;
    return newObject;
  },
  negateValue: _.negate(_.identity)
});

_.mixin({
  isDefined: _.compose(_.negateValue, _.isUndefined)
});
