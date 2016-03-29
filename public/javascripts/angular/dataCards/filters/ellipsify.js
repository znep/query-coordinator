module.exports = function() {
  return function(value, length) {
    if (_.isString(value) && _.isFinite(length) && length < value.length && length >= 0) {
      return `${value.slice(0, length)}...`;
    } else {
      return value;
    }
  };
};
