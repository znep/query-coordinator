angular.module('dataCards.models').factory('Filter', function(Assert, SoqlHelpers, DateHelpers) {

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

  BinaryOperatorFilter.prototype.serialize = function() {
    return {
      'function': 'BinaryOperator',
      'arguments': {
        'operator': this.operator,
        'operand': this.operand,
        'humanReadableOperand': this.humanReadableOperand
      }
    };
  };

  BinaryOperatorFilter.deserialize = function(blob) {
    var args = blob['arguments'];
    return new BinaryOperatorFilter(args.operator, args.operand, args.humanReadableOperand);
  };

  function TimeRangeFilter(start, end) {
    this.start = DateHelpers.deserializeFloatingTimestamp(start);
    this.end = DateHelpers.deserializeFloatingTimestamp(end);
    if (isNaN(this.start.getTime()) || isNaN(this.end.getTime())) {
      throw new Error('Could not create TimeRangeFilter: bad dates.');
    }
  };

  TimeRangeFilter.prototype.generateSoqlWhereFragment = function(field) {
    field = SoqlHelpers.replaceHyphensWithUnderscores(field);
    var encodedStart = SoqlHelpers.encodePrimitive(this.start);
    var encodedEnd = SoqlHelpers.encodePrimitive(this.end);
    return '{0} BETWEEN {1} AND {2}'.format(field, encodedStart, encodedEnd);
  };

  TimeRangeFilter.prototype.serialize = function() {
    return {
      'function': 'TimeRange',
      'arguments': {
        'start': DateHelpers.serializeFloatingTimestamp(this.start),
        'end': DateHelpers.serializeFloatingTimestamp(this.end)
      }
    };
  };

  TimeRangeFilter.deserialize = function(blob) {
    var args = blob['arguments'];
    if (!args.hasOwnProperty('start')) {
      throw new Error("Could not deserialize TimeRangeFilter: no 'start' property.");
    }
    if (!args.hasOwnProperty('end')) {
      throw new Error("Could not deserialize TimeRangeFilter: no 'end' property.");
    }
    var startDate = args.start;
    var endDate = args.end;
    return new TimeRangeFilter(startDate, endDate);
  };

  function IsNullFilter(isNull) {
    if (!_.isBoolean(isNull)) { throw new Error('IsNullFilter constructor passed non-boolean'); }
    this.isNull = isNull;
  }

  IsNullFilter.prototype.generateSoqlWhereFragment = function(field) {
    var fragment = this.isNull ? 'IS NULL' : 'IS NOT NULL';
    return SoqlHelpers.replaceHyphensWithUnderscores(field) + ' ' + fragment;
  };

  IsNullFilter.prototype.serialize = function() {
    return {
      'function': 'IsNull',
      'arguments': {
        'isNull': this.isNull
      }
    };
  };

  IsNullFilter.deserialize = function(blob) {
    return new IsNullFilter(blob['arguments'].isNull);
  };

  function deserialize(blob) {
    if (!_.isObject(blob['arguments'])) {
      throw new Error('No arguments provided in serialized filter')
    }

    var filterClass;
    switch(blob['function']) {
      case 'IsNull': filterClass = IsNullFilter; break;
      case 'BinaryOperator': filterClass = BinaryOperatorFilter; break;
      case 'TimeRange': filterClass = TimeRangeFilter; break;
      default: throw new Error('Unsupported serialized filter function: ' + blob['function']);
    }

    return filterClass.deserialize(blob);
  };

  return {
    TimeRangeFilter: TimeRangeFilter,
    BinaryOperatorFilter: BinaryOperatorFilter,
    IsNullFilter: IsNullFilter,
    deserialize: deserialize
  };
});
