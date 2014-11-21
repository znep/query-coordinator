_.mixin({
  isPresent: function(object) {
    return !_.isEmpty(object);
  },
  isDefined: function(value) {
    return !_.isUndefined(value);
  },
  instead: function(value, insteadValue) {
    return _.isPresent(value) ? value : insteadValue;
  },
  otherwise: _.instead
});
