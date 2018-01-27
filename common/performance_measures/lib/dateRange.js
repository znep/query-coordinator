import _ from 'lodash';
import moment from 'moment';

import { assert } from 'common/js_utils';
import { SoqlHelpers } from 'common/visualizations/dataProviders';

import { PeriodSizes } from './constants';

// Represents a date range, defined by a start date and a range size (day, week, month, year).
// The range is understood to be inclusive of the start moment, and exclusive of the end moment.
// For instance, this DateRange represents all of January 1988 in Zulu time (but none of February):
// new Moment('1988-01-01T00:00:00.000Z', 'month')
export default class DateRange {
  // Constructs a new date range.
  // start: datelike (string/Date/moment). The start of the date range.
  // size: The size of the date range. day/week/month/year.
  constructor(start, size) {
    const supportedSizes = _.values(PeriodSizes);
    // We also support days specifically for the zoomed in chart. 'day' is not a supported
    // size in metricConfig, only here.
    supportedSizes.push('day');
    if (!_(supportedSizes).includes(size)) {
      throw new Error(`Unsupported date range size: ${size}. Supported: ${supportedSizes.join()}`);
    }

    this.start = moment(start);
    this.end = moment(start).add(1, size);
    this.size = size;
  }

  // The date range starting on this date range's end date and having this date range's
  // size.
  next() {
    return new DateRange(this.end, this.size);
  }

  // Encodes the date range as a SoQL expression on a given column.
  asSoQL(columnName) {
    if (!_.isString(columnName)) {
      assert(_.isString(columnName), `columnName expected string, was ${columnName}`);
    }

    const startDateSoql = SoqlHelpers.soqlEncodeValue(this.start.toDate());
    const endDateSoql = SoqlHelpers.soqlEncodeValue(this.end.toDate());
    const column = SoqlHelpers.soqlEncodeColumnName(columnName);
    return `(${column} >= ${startDateSoql} AND ${column} < ${endDateSoql})`;
  }
}
