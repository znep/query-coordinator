_.mixin({
  isPresent: function(object) {
    return !_.isEmpty(object);
  },
  isDefined: function(value) {
    return !_.isUndefined(value);
  }
});
