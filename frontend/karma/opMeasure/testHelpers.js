import _ from 'lodash';
import moment from 'moment';
import { assert } from 'chai';

// Accepts strings, JS dates, or Moment dates.
export const assertDateRangeIs = (dateRange, start, end, granularity) => {
  assertDateEqual(dateRange.start, start, 'range start', granularity);
  assertDateEqual(dateRange.end, end, 'range end', granularity);
};

// Accepts strings, JS dates, or Moment dates.
export const assertDateEqual = (actual, expect, msg, granularity) => {
  actual = moment(actual);
  expect = moment(expect);

  assert.isTrue(
    moment(expect).isSame(actual, granularity),
    `${msg} actual: ${actual.toISOString()} expect: ${expect.toISOString()}`
  );
};

