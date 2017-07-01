import I18n from 'common/i18n';
import allLocales from 'common/i18n/config/locales';
import {
  mockCalendarDateColumn,
  mockMoneyColumn,
  mockNumberColumn,
  mockTextColumn,
  noopFilter
} from './data';
import { getFilterToggleText } from 'components/FilterBar/filters';

describe('filters', () => {
  beforeEach(() => {
    I18n.translations.en = allLocales.en;
  });

  afterEach(() => {
    I18n.translations = {};
  });
  describe('getFilterToggleText', () => {
    describe('calendar_date columns', () => {
      it('returns the name of the column when the filter is a noop filter', () => {
        assert.equal(getFilterToggleText(noopFilter, mockCalendarDateColumn), mockCalendarDateColumn.name);
      });

      it('returns a range of dates otherwise', () => {
        const filter = {
          arguments: {
            start: mockCalendarDateColumn.rangeMin,
            end: '1500-11-01T23:59:59'
          }
        };

        const text = getFilterToggleText(filter, mockCalendarDateColumn);

        assert.include(text, 'From 12/1');
        assert.include(text, 'to 11/1');
      });
    });

    describe('money columns', () => {
      it('returns the name of the column when the filter is a noop filter', () => {
        assert.equal(getFilterToggleText(noopFilter, mockMoneyColumn), mockMoneyColumn.name);
      });

      it('returns a "greater than" range when the end of the range is the max of the column', () => {
        const filter = {
          arguments: {
            start: 5,
            end: mockMoneyColumn.rangeMax
          }
        };

        assert.equal(getFilterToggleText(filter, mockMoneyColumn), `From 5 to ${mockMoneyColumn.rangeMax}`);
      });

      it('returns a "less than" range when the start of the range is the min of the column', () => {
        const filter = {
          arguments: {
            start: mockMoneyColumn.rangeMin,
            end: 19
          }
        };

        assert.equal(getFilterToggleText(filter, mockMoneyColumn), `From ${mockMoneyColumn.rangeMin} to 19`);
      });

      it('returns a generic range message otherwise', () => {
        const filter = {
          arguments: {
            start: 17,
            end: 23
          }
        };

        assert.equal(getFilterToggleText(filter, mockMoneyColumn), 'From 17 to 23');
      });
    });

    describe('number columns', () => {
      it('returns the name of the column when the filter is a noop filter', () => {
        assert.equal(getFilterToggleText(noopFilter, mockNumberColumn), mockNumberColumn.name);
      });

      it('returns a "greater than" range when the end of the range is the max of the column', () => {
        const filter = {
          arguments: {
            start: 5,
            end: mockNumberColumn.rangeMax
          }
        };

        assert.equal(getFilterToggleText(filter, mockNumberColumn), `From 5 to ${mockNumberColumn.rangeMax}`);
      });

      it('returns a "less than" range when the start of the range is the min of the column', () => {
        const filter = {
          arguments: {
            start: mockNumberColumn.rangeMin,
            end: 19
          }
        };

        assert.equal(getFilterToggleText(filter, mockNumberColumn), `From ${mockNumberColumn.rangeMin} to 19`);
      });

      it('returns a generic range message otherwise', () => {
        const filter = {
          arguments: {
            start: 17,
            end: 23
          }
        };

        assert.equal(getFilterToggleText(filter, mockNumberColumn), 'From 17 to 23');
      });
    });

    describe('text columns', () => {
      it('returns the name of the column when the filter is a noop filter', () => {
        assert.equal(getFilterToggleText(noopFilter, mockTextColumn), mockTextColumn.name);
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

        assert.equal(getFilterToggleText(filter, mockTextColumn), 'purple');
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

        assert.equal(getFilterToggleText(filter, mockTextColumn), 'Excluded purple');
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

        assert.equal(getFilterToggleText(filter, mockTextColumn), '2 selected');
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

        assert.equal(getFilterToggleText(filter, mockTextColumn), '2 excluded');
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

        assert.equal(getFilterToggleText(filter, mockTextColumn), '(No value)');
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

        assert.equal(getFilterToggleText(filter, mockTextColumn), 'Excluded (No value)');
      });
    });
  });
});
