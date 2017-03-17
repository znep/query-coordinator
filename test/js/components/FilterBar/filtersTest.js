import _ from 'lodash';
import { mockCalendarDateColumn, mockNumberColumn, mockTextColumn, noopFilter } from './data';
import { getFilterToggleText } from 'components/FilterBar/filters';

describe('filters', () => {
  describe('getFilterToggleText', () => {
    describe('calendar_date columns', () => {
      const column = mockCalendarDateColumn;
      const { min, max } = column;

      it('returns the name of the column when the filter is a noop filter', () => {
        expect(getFilterToggleText(noopFilter, column)).to.equal(column.name);
      });

      it('returns a range of dates otherwise', () => {
        const filter = {
          arguments: {
            start: min,
            end: '1500-11-01T23:59:59'
          }
        };

        const text = getFilterToggleText(filter, column);

        expect(text).to.contain('From December');
        expect(text).to.contain('to November');
      });
    });

    describe('number columns', () => {
      const column = mockNumberColumn;
      const { min, max } = column;

      it('returns the name of the column when the filter is a noop filter', () => {
        expect(getFilterToggleText(noopFilter, column)).to.equal(column.name);
      });

      it('returns a "greater than" range when the end of the range is the max of the column', () => {
        const filter = {
          arguments: {
            start: 5,
            end: max
          }
        };

        expect(getFilterToggleText(filter, column)).to.equal('Greater than 5');
      });

      it('returns a "less than" range when the start of the range is the min of the column', () => {
        const filter = {
          arguments: {
            start: min,
            end: 19
          }
        };

        expect(getFilterToggleText(filter, column)).to.equal('Less than 19');
      });

      it('returns a generic range message otherwise', () => {
        const filter = {
          arguments: {
            start: 17,
            end: 23
          }
        };

        expect(getFilterToggleText(filter, column)).to.equal('From 17 to 23');
      });
    });

    describe('text columns', () => {
      const column = mockTextColumn;

      it('returns the name of the column when the filter is a noop filter', () => {
        expect(getFilterToggleText(noopFilter, column)).to.equal(column.name);
      });

      it('returns the selected value if one value is selected', () => {
        const filter = {
          arguments: [
            {
              operator: '=',
              operand: 'purple'
            }
          ]
        };

        expect(getFilterToggleText(filter, column)).to.equal('purple');
      });

      it('returns a negation message if one value is negated', () => {
        const filter = {
          joinOn: 'AND',
          arguments: [
            {
              operator: '=',
              operand: 'purple'
            }
          ]
        };

        expect(getFilterToggleText(filter, column)).to.equal('Excluded purple');
      });

      it('returns the number of values selected if more than one is selected', () => {
        const filter = {
          arguments: [
            {
              operator: '=',
              operand: 'purple'
            },
            {
              operator: '=',
              operand: 'cuttlefish'
            }
          ]
        };

        expect(getFilterToggleText(filter, column)).to.equal('2 selected');
      });

      it('returns the number of values omitted if more than one is selected and negated', () => {
        const filter = {
          joinOn: 'AND',
          arguments: [
            {
              operator: '=',
              operand: 'purple'
            },
            {
              operator: '=',
              operand: 'cuttlefish'
            }
          ]
        };

        expect(getFilterToggleText(filter, column)).to.equal('2 excluded');
      });

      it('returns the null value string if the null value is selected', () => {
        const filter = {
          arguments: [
            {
              operator: '=',
              operand: null
            }
          ]
        };

        expect(getFilterToggleText(filter, column)).to.equal('(No value)');
      });

      it('returns the null value exclusion string if the null value is omitted', () => {
        const filter = {
          joinOn: 'AND',
          arguments: [
            {
              operator: '=',
              operand: null
            }
          ]
        };

        expect(getFilterToggleText(filter, column)).to.equal('Excluded (No value)');
      });
    });
  });
});
