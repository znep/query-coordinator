module.exports = function(I18n) {
  return function() {
    return I18n.t.apply(this, arguments);
  };
};
