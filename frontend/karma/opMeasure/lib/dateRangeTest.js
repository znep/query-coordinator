import _ from 'lodash';
import { assert } from 'chai';
import DateRange from 'lib/dateRange';

import { assertDateRangeIs } from '../testHelpers';

describe('dateRange', () => {
  const sampleDate = new Date('1988-01-10T08:00:00.000Z');

  it('rejects invalid sizes', () => {
    assert.throws(() => new DateRange(sampleDate, 'second'));
    assert.throws(() => new DateRange(sampleDate, 'd'));
    assert.throws(() => new DateRange(sampleDate, null));
  });

  describe('start/end/size properties', () => {
    it('returns correct dates for size=day', () => {
      assertDateRangeIs(
        new DateRange(sampleDate, 'day'),
        '1988-01-10T08:00:00.000Z',
        '1988-01-11T08:00:00.000Z'
      );
    });
    it('returns correct dates for size=week', () => {
      assertDateRangeIs(
        new DateRange(sampleDate, 'week'),
        '1988-01-10T08:00:00.000Z',
        '1988-01-17T08:00:00.000Z'
      );
    });
    it('returns correct dates for size=month', () => {
      assertDateRangeIs(
        new DateRange(sampleDate, 'month'),
        '1988-01-10T08:00:00.000Z',
        '1988-02-10T08:00:00.000Z'
      );
    });
    it('returns correct dates for size=year', () => {
      assertDateRangeIs(
        new DateRange(sampleDate, 'year'),
        '1988-01-10T08:00:00.000Z',
        '1989-01-10T08:00:00.000Z'
      );
    });
  });

  describe('next', () => {
    it('returns correct date for size=day', () => {
      assertDateRangeIs(
        new DateRange(sampleDate, 'day').next(),
        '1988-01-11T08:00:00.000Z',
        '1988-01-12T08:00:00.000Z'
      );
    });
    it('returns correct date for size=week', () => {
      assertDateRangeIs(
        new DateRange(sampleDate, 'week').next(),
        '1988-01-17T08:00:00.000Z',
        '1988-01-24T08:00:00.000Z'
      );
    });
    it('returns correct date for size=month', () => {
      assertDateRangeIs(
        new DateRange(sampleDate, 'month').next(),
        '1988-02-10T08:00:00.000Z',
        '1988-03-10T08:00:00.000Z'
      );
    });
    it('returns correct date for size=year', () => {
      assertDateRangeIs(
        new DateRange(sampleDate, 'year').next(),
        '1989-01-10T08:00:00.000Z',
        '1990-01-10T08:00:00.000Z'
      );
    });
  });

  describe('asSoQL', () => {
    it('throws if not given a column', () => {
      assert.throws(() =>
        new DateRange(sampleDate, 'week').asSoQL()
      );
    });
    it('encodes SoQL', () => {
      // Since we specified the sample date in Zulu time and SoQL uses "local-ish" time, we
      // must go through the local Date implementation to figure out the HH value to expect
      // in the SoQL query.
      const hours = `0${sampleDate.getHours()}`;

      assert.equal(
        `(\`my_column\` >= '1988-01-10T${hours}:00:00' AND \`my_column\` < '1988-01-17T${hours}:00:00')`,
        new DateRange(sampleDate, 'week').asSoQL('my_column')
      );
    });
  });
});
