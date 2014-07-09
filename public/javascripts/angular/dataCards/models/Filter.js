angular.module('dataCards.models').factory('Filter', function(SoqlHelpers) {

  function BinaryOperatorFilter(operator, operand) {
    this.operator = operator;
    this.operand = operand;
  };

  BinaryOperatorFilter.prototype.generateSoqlWhereFragment = function(field) {
    return field + this.operator + SoqlHelpers.encodeSoqlString(this.operand);
  };

  return {
    withBinaryOperator: function(operator, operand) { return new BinaryOperatorFilter(operator, operand); }
  };
});
