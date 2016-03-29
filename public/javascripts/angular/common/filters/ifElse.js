module.exports = function IfElseFilter() {
  return function(predicate, affirmativeValue, negativeValue) {
    return predicate ? affirmativeValue : negativeValue;
  };
};
