// Breaking with classic enum convention here because we don't want to enforce an all uppercase API when dealing with measure calculation types.
// We decided to have slightly awkward enums here instead of awkward `toUpperCase()` everywhere we are comparing values
export const CalculationTypes = Object.freeze({
  COUNT: 'count',
  RATE: 'rate',
  RECENT: 'recent',
  SUM: 'sum'
});

export const RateAggregationTypes = Object.freeze({
  COUNT: 'count',
  SUM: 'sum'
});

export const PeriodTypes = Object.freeze({
  OPEN: 'open',
  CLOSED: 'closed'
});

export const PeriodSizes = Object.freeze([
  'year',
  'month',
  'week'
]);
