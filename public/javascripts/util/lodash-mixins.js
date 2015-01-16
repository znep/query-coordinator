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
  otherwise: _.instead
});
