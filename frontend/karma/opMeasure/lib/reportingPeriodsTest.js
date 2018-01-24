import _ from 'lodash';
import moment from 'moment';
import { assert } from 'chai';
import DateRange from 'opMeasure/lib/dateRange';
import ReportingPeriods from 'opMeasure/lib/reportingPeriods';

import { assertDateRangeIs } from '../testHelpers';

describe('reportingPeriods', () => {
  const sampleDate = '1988-01-10T08:00:00.000Z';
  describe('isConfigValid', () => {
    it('returns false for invalid configs', () => {
      assert.isFalse(ReportingPeriods.isConfigValid({ size: 'year', type: 'o negative', startDate: sampleDate }));
       // Day not supported.
      assert.isFalse(ReportingPeriods.isConfigValid({ size: 'day', type: 'open', startDate: sampleDate }));
      assert.isFalse(ReportingPeriods.isConfigValid({ type: 'open', startDate: sampleDate }));
      assert.isFalse(ReportingPeriods.isConfigValid({ size: 'year', startDate: sampleDate }));
      assert.isFalse(ReportingPeriods.isConfigValid({ size: 'year', type: 'open' }));
      assert.isFalse(ReportingPeriods.isConfigValid({}));
      assert.isFalse(ReportingPeriods.isConfigValid());
    });

    it('returns true for valid configs', () => {
      assert.isTrue(ReportingPeriods.isConfigValid({ size: 'year', type: 'open', startDate: sampleDate }));
      assert.isTrue(ReportingPeriods.isConfigValid({ size: 'month', type: 'open', startDate: sampleDate }));
      assert.isTrue(ReportingPeriods.isConfigValid({ size: 'week', type: 'open', startDate: sampleDate }));
      assert.isTrue(ReportingPeriods.isConfigValid({ size: 'year', type: 'closed', startDate: sampleDate }));
      assert.isTrue(ReportingPeriods.isConfigValid({ size: 'month', type: 'closed', startDate: sampleDate }));
      assert.isTrue(ReportingPeriods.isConfigValid({ size: 'week', type: 'closed', startDate: sampleDate }));
    });
  });

  // Minimal test case - implementation uses isConfigValid internally.
  describe('assertConfigValid', () => {
    it('trows for invalid configs', () => {
      assert.throws(() => {
        ReportingPeriods.assertConfigValid({ size: 'year', type: 'o negative', startDate: sampleDate });
      });
    });

    it('returns true for valid configs', () => {
      assert.doesNotThrow(() => {
        ReportingPeriods.assertConfigValid({ size: 'year', type: 'open', startDate: sampleDate });
      });
    });
  });

  describe('constructor', () => {
    it('throws if config invalid', () => {
      assert.throws(() => new ReportingPeriods({}), /Invalid reporting period configuration/);
    });
  });

  // This is tricky because the implementation uses the current date to figure out
  // what to return... so we override the system clock.
  const nowNow = moment('1998-05-12T14:00:00.000Z');
  describe('forReportedMetricValue', () => {
    describe('open reporting period', () => {
      describe('starting way in the past', () => {
        const rp = new ReportingPeriods({ startDate: sampleDate, size: 'month', type: 'open' });
        it('returns expected date', () => {
          assertDateRangeIs(
            rp.forReportedMetricValue(nowNow),
            '1998-05-10T07:00:00.000Z', // 07 zulu instead of 08 zulu because of daylight saving.
            '1998-06-10T07:00:00.000Z',
            'day' // Granularity of 1 day to work around test machine timezone issues.
          );
        });
      });

      describe('starting yesterday', () => {
        const rp = new ReportingPeriods({
          startDate: moment(nowNow).subtract(1, 'day'),
          size: 'month',
          type: 'open'
        });
        it('returns expected date', () => {
          assertDateRangeIs(
            rp.forReportedMetricValue(nowNow),
            '1998-05-11T14:00:00.000Z',
            '1998-06-11T14:00:00.000Z',
            'day' // Granularity of 1 day to work around test machine timezone issues.
          );
        });
      });

      describe('starting today', () => {
        const rp = new ReportingPeriods({
          startDate: nowNow,
          size: 'month', type: 'open'
        });
        it('returns expected date', () => {
          assertDateRangeIs(
            rp.forReportedMetricValue(nowNow),
            '1998-05-12T14:00:00.000Z',
            '1998-06-12T14:00:00.000Z'
          );
        });
      });

      describe('starting in the future', () => {
        const rp = new ReportingPeriods({
          startDate: moment().add(1, 'year'),
          size: 'month', type: 'open'
        });
        it('returns undefined', () => {
          assert.isUndefined(rp.forReportedMetricValue(nowNow));
        });
      });
    });

    describe('closed reporting period', () => {
      describe('starting way in the past', () => {
        const rp = new ReportingPeriods({ startDate: sampleDate, size: 'month', type: 'closed' });
        it('returns expected date', () => {
          assertDateRangeIs(
            rp.forReportedMetricValue(nowNow),
            '1998-04-10T07:00:00.000Z',
            '1998-05-10T07:00:00.000Z',
            'day' // Granularity of 1 day to work around test machine timezone issues.
          );
        });
      });

      describe('starting yesterday', () => {
        const rp = new ReportingPeriods({
          startDate: moment(nowNow).subtract(1, 'day'),
          size: 'month',
          type: 'closed'
        });
        it('returns undefined', () => {
          assert.isUndefined(rp.forReportedMetricValue(nowNow));
        });
      });

      describe('starting today', () => {
        const rp = new ReportingPeriods({
          startDate: nowNow,
          size: 'month', type: 'closed'
        });
        it('returns undefined', () => {
          assert.isUndefined(rp.forReportedMetricValue(nowNow));
        });
      });

      describe('starting in the future', () => {
        const rp = new ReportingPeriods({
          startDate: moment().add(1, 'year'),
          size: 'month', type: 'closed'
        });
        it('returns undefined', () => {
          assert.isUndefined(rp.forReportedMetricValue(nowNow));
        });
      });
    });
  });
});
