angular.module('dataCards.models').factory('Filter', function(SoqlHelpers) {

  function BinaryOperatorFilter(operator, operand) {
    if (!_.isString(operator)) { throw new Error('BinaryOperatorFilter passed invalid operator'); }
    if (operator === '') { throw new Error('BinaryOperatorFilter passed empty operator'); }
    if (_.isUndefined(operand) || _.isNull(operand)) { throw new Error('BinaryOperatorFilter passed invalid operand'); }

    this.operator = operator;
    this.operand = operand;
  };

  BinaryOperatorFilter.prototype.generateSoqlWhereFragment = function(field) {
    return field + this.operator + SoqlHelpers.encodePrimitive(this.operand);
  };

  function IsNullFilter(isNull) {
    if (!_.isBoolean(isNull)) { throw new Error('IsNullFilter constructor passed non-boolean'); }
    this.isNull = isNull;
  }

  IsNullFilter.prototype.generateSoqlWhereFragment = function(field) {
    var fragment = this.isNull ? 'IS NULL' : 'IS NOT NULL';
    return field + ' ' + fragment;
  };

  return {
    BinaryOperatorFilter: BinaryOperatorFilter,
    IsNullFilter: IsNullFilter
  };
});
