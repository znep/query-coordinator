_.mixin({
  isPresent: function(object) {
    return !_.isEmpty(object) || (_.isNumber(object) && !_.isNaN(object) &&  object !== 0);
  },
  isDefined: function(value) {
    return !_.isUndefined(value);
  },
  instead: function(value, insteadValue) {
    return _.isPresent(value) ? value : insteadValue;
  },
  otherwise: _.instead
});
