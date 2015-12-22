angular.module('dataCards.models').factory('Filter', function(SoqlHelpers, DateHelpers) {
  'use strict';

  function BinaryOperatorFilter(operator, operand, humanReadableOperand) {
    if (!_.isString(operator)) { throw new Error('BinaryOperatorFilter passed invalid operator'); }
    if (operator === '') { throw new Error('BinaryOperatorFilter passed empty operator'); }
    if (_.isUndefined(operand) || _.isNull(operand)) { throw new Error('BinaryOperatorFilter passed invalid operand'); }

    this.operator = operator;
    this.operand = operand;
    this.humanReadableOperand = humanReadableOperand;
  }

  BinaryOperatorFilter.prototype.generateSoqlWhereFragment = function(field) {
    return SoqlHelpers.formatFieldName(field) + this.operator + SoqlHelpers.encodePrimitive(this.operand);
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
    var args = blob.arguments;
    return new BinaryOperatorFilter(args.operator, args.operand, args.humanReadableOperand);
  };

  // This filter captures the relationship between a source column,
  // a computed column, and the state of filtering source column
  // values by computed region.
  function BinaryComputedGeoregionOperatorFilter(operator, operand, computedColumnName, humanReadableOperand) {

    if (!_.isString(operator)) {
      throw new Error('BinaryComputedGeoregionOperatorFilter passed invalid operator');
    }

    if (operator === '') {
      throw new Error('BinaryComputedGeoregionOperatorFilter passed empty operator');
    }

    if (_.isUndefined(operand) || _.isNull(operand)) {
      throw new Error('BinaryComputedGeoregionOperatorFilter passed invalid operand');
    }

    if (!_.isString(computedColumnName)) {
      throw new Error('BinaryComputedGeoregionOperatorFilter passed invalid computedColumnName');
    }

    this.operator = operator;
    this.operand = operand;
    this.computedColumnName = computedColumnName;
    this.humanReadableOperand = humanReadableOperand;
  }

  // Note that unlike all the other filter types, the BinaryComputedGeoregionOperator
  // will use the `computedColumnName` that it stores internally to generate a SoQL
  // where clause fragment, as opposed to taking the column name (a.k.a. fieldname)
  // as an argument.
  BinaryComputedGeoregionOperatorFilter.prototype.generateSoqlWhereFragment = function() {

    return SoqlHelpers.formatFieldName(this.computedColumnName) +
      this.operator +
      SoqlHelpers.encodePrimitive(this.operand);
  };

  BinaryComputedGeoregionOperatorFilter.prototype.serialize = function() {

    return {
      'function': 'BinaryComputedGeoregionOperator',
      'computedColumnName': this.computedColumnName,
      'arguments': {
        'operator': this.operator,
        'operand': this.operand,
        'humanReadableOperand': this.humanReadableOperand
      }
    };
  };

  BinaryComputedGeoregionOperatorFilter.deserialize = function(blob) {
    var args = blob.arguments;

    return new BinaryComputedGeoregionOperatorFilter(
      args.operator,
      args.operand,
      blob.computedColumnName,
      args.humanReadableOperand
    );
  };

  function TimeRangeFilter(start, end) {
    this.start = DateHelpers.deserializeFloatingTimestamp(start);
    this.end = DateHelpers.deserializeFloatingTimestamp(end);
    if (isNaN(this.start.getTime()) || isNaN(this.end.getTime())) {
      throw new Error('Could not create TimeRangeFilter: bad dates.');
    }
  }

  function IsNullFilter(isNull) {
    if (!_.isBoolean(isNull)) { throw new Error('IsNullFilter constructor passed non-boolean'); }
    this.isNull = isNull;
  }

  IsNullFilter.prototype.generateSoqlWhereFragment = function(field) {
    var fragment = this.isNull ? 'IS NULL' : 'IS NOT NULL';
    return SoqlHelpers.formatFieldName(field) + ' ' + fragment;
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
    return new IsNullFilter(blob.arguments.isNull);
  };

  TimeRangeFilter.prototype.generateSoqlWhereFragment = function(field) {
    field = SoqlHelpers.formatFieldName(field);
    var encodedStart = SoqlHelpers.encodePrimitive(this.start);
    var encodedEnd = SoqlHelpers.encodePrimitive(this.end);
    return '{0} >= {1} AND {0} < {2}'.format(field, encodedStart, encodedEnd);
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
    var args = blob.arguments;
    if (!args.hasOwnProperty('start')) {
      throw new Error('Could not deserialize TimeRangeFilter: no "start" property.');
    }
    if (!args.hasOwnProperty('end')) {
      throw new Error('Could not deserialize TimeRangeFilter: no "end" property.');
    }
    var startDate = args.start;
    var endDate = args.end;
    return new TimeRangeFilter(startDate, endDate);
  };

  function ValueRangeFilter(start, end) {
    this.start = start;
    this.end = end;
  }

  ValueRangeFilter.prototype.generateSoqlWhereFragment = function(field) {
    return '{0} >= {1} AND {0} < {2}'.format(
      SoqlHelpers.formatFieldName(field),
      SoqlHelpers.encodePrimitive(this.start),
      SoqlHelpers.encodePrimitive(this.end)
    );
  };

  ValueRangeFilter.prototype.serialize = function() {
    return {
      'function': 'ValueRange',
      'arguments': {
        'start': this.start,
        'end': this.end
      }
    };
  };

  ValueRangeFilter.deserialize = function(blob) {
    var args = blob.arguments;
    if (!_(args).has('start')) {
      throw new Error('Could not deserialize ValueRangeFilter: no "start" property.');
    }
    if (!_(args).has('end')) {
      throw new Error('Could not deserialize ValueRangeFilter: no "end" property.');
    }
    return new ValueRangeFilter(args.start, args.end);
  };

  function deserialize(blob) {
    if (!_.isObject(blob.arguments)) {
      throw new Error('No arguments provided in serialized filter');
    }

    var filterClass;
    switch (blob['function']) {
      case 'IsNull': filterClass = IsNullFilter; break;
      case 'BinaryOperator': filterClass = BinaryOperatorFilter; break;
      case 'BinaryComputedGeoregionOperator': filterClass = BinaryComputedGeoregionOperatorFilter; break;
      case 'TimeRange': filterClass = TimeRangeFilter; break;
      case 'ValueRange': filterClass = ValueRangeFilter; break;
      default: throw new Error('Unsupported serialized filter function: ' + blob['function']);
    }

    return filterClass.deserialize(blob);
  }

  return {
    IsNullFilter: IsNullFilter,
    BinaryOperatorFilter: BinaryOperatorFilter,
    BinaryComputedGeoregionOperatorFilter: BinaryComputedGeoregionOperatorFilter,
    TimeRangeFilter: TimeRangeFilter,
    ValueRangeFilter: ValueRangeFilter,
    deserialize: deserialize
  };
});
