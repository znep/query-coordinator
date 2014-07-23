angular.module('dataCards.models').factory('Filter', function(SoqlHelpers) {


  function BinaryOperatorFilter(operator, operand) {
    if (!_.isString(operator)) { throw new Error('BinaryOperatorFilter passed invalid operator'); }
    if (operator === '') { throw new Error('BinaryOperatorFilter passed empty operator'); }
    if (_.isUndefined(operand) || _.isNull(operand)) { throw new Error('BinaryOperatorFilter passed invalid operand'); }

    this.operator = operator;
    this.operand = operand;
  };

  BinaryOperatorFilter.prototype.generateSoqlWhereFragment = function(field) {
    return SoqlHelpers.replaceHyphensWithUnderscores(field) + this.operator + SoqlHelpers.encodePrimitive(this.operand);
  };

  function TimeOperatorFilter(precision, operand) {
    if (!_.isString(precision)) { throw new Error('TimeOperatorFilter passed invalid precision'); }
    var validPrecisions = _.keys(SoqlHelpers.timeIntervalToDateTrunc);
    if (!_.contains(validPrecisions, precision)) {
      throw new Error('TimeOperatorFilter passed invalid precision {0}. Valid are {1}.'.
        format(JSON.stringify(precision), JSON.stringify(validPrecisions)));
    }
    if (_.isUndefined(operand) || _.isNull(operand)) { throw new Error('TimeOperatorFilter passed invalid operand'); }

    this.precision = precision;
    this.operand = operand;
  };

  TimeOperatorFilter.prototype.generateSoqlWhereFragment = function(field) {
    return SoqlHelpers.replaceHyphensWithUnderscores('date_trunc_{0}({1})='.format(SoqlHelpers.timeIntervalToDateTrunc[this.precision], field)) + SoqlHelpers.encodePrimitive(this.operand);
  };

  function IsNullFilter(isNull) {
    if (!_.isBoolean(isNull)) { throw new Error('IsNullFilter constructor passed non-boolean'); }
    this.isNull = isNull;
  }

  IsNullFilter.prototype.generateSoqlWhereFragment = function(field) {
    var fragment = this.isNull ? 'IS NULL' : 'IS NOT NULL';
    return SoqlHelpers.replaceHyphensWithUnderscores(field) + ' ' + fragment;
  };

  return {
    TimeOperatorFilter: TimeOperatorFilter,
    BinaryOperatorFilter: BinaryOperatorFilter,
    IsNullFilter: IsNullFilter
  };
});
