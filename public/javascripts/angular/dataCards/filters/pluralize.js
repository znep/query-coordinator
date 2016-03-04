module.exports = function(PluralizeService) {
  return function() {
    return PluralizeService.pluralize.apply(this, arguments);
  };
};
