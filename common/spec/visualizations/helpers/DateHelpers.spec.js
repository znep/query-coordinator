import { snapToBinStartDate, deserializeFloatingTimestamp } from 'common/visualizations/helpers/DateHelpers';

describe('DateHelpers', () => {
  describe('snapToBinStartDate', () => {
    // Note: All of these are floating timestamps.
    // The behavior of snapToBinStartDate is local to the user's
    // timezone. As an example, snapToBinStartDate considers
    // the 1980's to begin in Seattle 8 hours after they began in
    // London.
    const startOfTheEighties = '1980-01-01T00:00:00.000';
    const secondIntoTheEighties = '1980-01-01T00:00:00.000';
    const midFeb88 = '1988-02-10T04:00:00.000';
    const endOfTheEighties = '1988-12-31T23:59:59.999';

    describe('a value in the middle of a bin', () => {
      it('returns the expected value', () => {
        assert.deepEqual(
          snapToBinStartDate(deserializeFloatingTimestamp(midFeb88), 'DAY'),
          deserializeFloatingTimestamp('1988-02-10T00:00:00.000')
        );
        assert.deepEqual(
          snapToBinStartDate(deserializeFloatingTimestamp(midFeb88), 'MONTH'),
          deserializeFloatingTimestamp('1988-02-01T00:00:00.000')
        );
        assert.deepEqual(
          snapToBinStartDate(deserializeFloatingTimestamp(midFeb88), 'YEAR'),
          deserializeFloatingTimestamp('1988-01-01T00:00:00.000')
        );
        assert.deepEqual(
          snapToBinStartDate(deserializeFloatingTimestamp(midFeb88), 'DECADE'),
          deserializeFloatingTimestamp('1980-01-01T00:00:00.000')
        );
      });
    });

    describe('a value at the beginning of a bin', () => {
      it('returns the expected value', () => {
        assert.deepEqual(
          snapToBinStartDate(deserializeFloatingTimestamp(startOfTheEighties), 'DAY'),
          deserializeFloatingTimestamp(startOfTheEighties)
        );
        assert.deepEqual(
          snapToBinStartDate(deserializeFloatingTimestamp(startOfTheEighties), 'MONTH'),
          deserializeFloatingTimestamp(startOfTheEighties)
        );
        assert.deepEqual(
          snapToBinStartDate(deserializeFloatingTimestamp(startOfTheEighties), 'YEAR'),
          deserializeFloatingTimestamp(startOfTheEighties)
        );
        assert.deepEqual(
          snapToBinStartDate(deserializeFloatingTimestamp(startOfTheEighties), 'DECADE'),
          deserializeFloatingTimestamp(startOfTheEighties)
        );
      });
    });

    describe('a value at the end of a bin', () => {
      it('returns the expected value', () => {
        assert.deepEqual(
          snapToBinStartDate(deserializeFloatingTimestamp(endOfTheEighties), 'DAY'),
          deserializeFloatingTimestamp('1988-12-31T00:00:00.000')
        );
        assert.deepEqual(
          snapToBinStartDate(deserializeFloatingTimestamp(endOfTheEighties), 'MONTH'),
          deserializeFloatingTimestamp('1988-12-01T00:00:00.000')
        );
        assert.deepEqual(
          snapToBinStartDate(deserializeFloatingTimestamp(endOfTheEighties), 'YEAR'),
          deserializeFloatingTimestamp('1988-01-01T00:00:00.000')
        );
        assert.deepEqual(
          snapToBinStartDate(deserializeFloatingTimestamp(endOfTheEighties), 'DECADE'),
          deserializeFloatingTimestamp(startOfTheEighties)
        );
      });
    });

    describe('a value one second into a bin', () => {
      it('returns the expected value', () => {
        assert.deepEqual(
          snapToBinStartDate(deserializeFloatingTimestamp(secondIntoTheEighties), 'DAY'),
          deserializeFloatingTimestamp(startOfTheEighties)
        );
        assert.deepEqual(
          snapToBinStartDate(deserializeFloatingTimestamp(secondIntoTheEighties), 'MONTH'),
          deserializeFloatingTimestamp(startOfTheEighties)
        );
        assert.deepEqual(
          snapToBinStartDate(deserializeFloatingTimestamp(secondIntoTheEighties), 'YEAR'),
          deserializeFloatingTimestamp(startOfTheEighties)
        );
        assert.deepEqual(
          snapToBinStartDate(deserializeFloatingTimestamp(secondIntoTheEighties), 'DECADE'),
          deserializeFloatingTimestamp(startOfTheEighties)
        );
      });
    });
  });
});
