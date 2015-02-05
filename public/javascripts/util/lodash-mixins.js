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
  isDefined: function(value) {
    return !_.isUndefined(value);
  },
  instead: function(value, insteadValue) {
    return _.isPresent(value) ? value : insteadValue;
  },
  getPathOrElse: function(object, path, elseCase) {
    var value = _.reduce(path.split('.'), function(obj, key) {
      return obj ? obj[key] : obj;
    }, object);
    if (_.isUndefined(value) && _.isDefined(elseCase)) {
      return elseCase;
    }
    return value;
  },
  isPathDefined: function(object, path) {
    return _.isDefined(_.getPathOrElse(object, path));
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
  }
});
