angular.module('dataCards.models').factory('Filter', function(ModelHelper) {
  function BinaryOperatorFilter(operator, operand) {
    this.operator = operator;
    this.operand = operand;
  };

  BinaryOperatorFilter.prototype.generateSoqlWhereFragment = function(field) {
    return field + this.operator + "'" + this.operand + "'";
  };

  return {
    withBinaryOperator: function(operator, operand) { return new BinaryOperatorFilter(operator, operand); }
  };
});
