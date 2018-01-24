import _ from 'lodash';
import moment from 'moment';

import { assert } from 'common/js_utils';

import DateRange from './dateRange';
import { PeriodTypes, PeriodSizes } from './constants';

// Represents a set of reporting periods (plural - a reporting period
// configuration defines an infinite series of reporting periods).
export default class ReportingPeriods {

  // Returns true if the given reportingPeriodConfig is fully specified
  // and valid.
  static isConfigValid(reportingPeriodConfig) {
    if (!_.isObject(reportingPeriodConfig) || _.isEmpty(reportingPeriodConfig)) {
      return false;
    }

    const { type, size, startDate } = reportingPeriodConfig;

    if (!(type && size && startDate)) {
      return false;
    }

    if (!moment(startDate).isValid()) {
      return false;
    }

    // _.includes works nicely on objects
    if (!_.includes(PeriodTypes, type) || !_.includes(PeriodSizes, size)) {
      return false;
    }

    return true;
  }

  // Wraps isConfigValid in an assert.
  static assertConfigValid(reportingPeriodConfig) {
    assert(
      ReportingPeriods.isConfigValid(reportingPeriodConfig),
      'Invalid reporting period configuration'
    );
  }

  constructor(reportingPeriodConfig) {
    ReportingPeriods.assertConfigValid(reportingPeriodConfig);

    this.startDate = moment(reportingPeriodConfig.startDate);
    this.type = reportingPeriodConfig.type;
    this.size = reportingPeriodConfig.size;
  }

  // This determines the date range for i.e. the metric result card.
  forReportedMetricValue(
    // Optional, used to allow tests to override the system clock.
    // May be used in the future for other scenarios.
    now = moment()
  ) {
    return _.last(this.seriesToDate(now));
  }

  // Returns a series of DateRange instances
  // starting from the reporting period's start date
  // through today.
  seriesToDate(
    // Optional, used to allow tests to override the system clock.
    // May be used in the future for other scenarios.
    now = moment()
  ) {
    if (this.startDate.isAfter(now)) {
      return [];
    }

    let x = new DateRange(this.startDate, this.size);
    const series = [];
    while (!now.isBetween(x.start, x.end, null, '[)')) {
      series.push(x);
      x = x.next();
    }

    if (this.type === 'open') {
      series.push(x);
    }

    return series;
  }
}
