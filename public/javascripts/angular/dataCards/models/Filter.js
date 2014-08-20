angular.module('dataCards.models').factory('Filter', function(Assert, SoqlHelpers) {

  function BinaryOperatorFilter(operator, operand, humanReadableOperand) {
    if (!_.isString(operator)) { throw new Error('BinaryOperatorFilter passed invalid operator'); }
    if (operator === '') { throw new Error('BinaryOperatorFilter passed empty operator'); }
    if (_.isUndefined(operand) || _.isNull(operand)) { throw new Error('BinaryOperatorFilter passed invalid operand'); }

    this.operator = operator;
    this.operand = operand;
    this.humanReadableOperand = humanReadableOperand;
  };

  BinaryOperatorFilter.prototype.generateSoqlWhereFragment = function(field) {
    return SoqlHelpers.replaceHyphensWithUnderscores(field) + this.operator + SoqlHelpers.encodePrimitive(this.operand);
  };

  function TimeRangeFilter(start, end) {
    Assert(moment.isMoment(start), 'TimeRangeFilter passed non-moment start: ' + start);
    Assert(moment.isMoment(end), 'TimeRangeFilter passed non-moment end: ' + end);
    Assert(start.isValid(), 'TimeRangeFilter passed invalid start moment: ' + start);
    Assert(end.isValid(), 'TimeRangeFilter passed invalid end moment: ' + end);

    this.start = start;
    this.end = end;
  };

  TimeRangeFilter.prototype.generateSoqlWhereFragment = function(field) {
    field = SoqlHelpers.replaceHyphensWithUnderscores(field);
    var encodedStart = SoqlHelpers.encodePrimitive(this.start);
    var encodedEnd = SoqlHelpers.encodePrimitive(this.end);
    return '{0} > {1} AND {0} < {2}'.format(field, encodedStart, encodedEnd);
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
    TimeRangeFilter: TimeRangeFilter,
    BinaryOperatorFilter: BinaryOperatorFilter,
    IsNullFilter: IsNullFilter
  };
});
