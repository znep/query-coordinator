import _ from 'lodash';

import I18n from 'common/i18n';
import allLocales from 'common/i18n/config/locales';
import {
  mockCalendarDateColumn,
  mockMoneyColumn,
  mockNumberColumn,
  mockTextColumn,
  noopFilter
} from './data';
import { getFilterHumanText } from 'components/FilterBar/filters';

describe('filters', () => {
  beforeEach(() => {
    I18n.translations.en = allLocales.en;
  });

  afterEach(() => {
    I18n.translations = {};
  });
  describe('getFilterHumanText', () => {
    describe('calendar_date columns', () => {
      it('returns the name of the column when the filter is a noop filter', () => {
        const selectLabel = I18n.t('shared.components.filter_bar.select');
        assert.equal(getFilterHumanText(noopFilter, mockCalendarDateColumn), selectLabel);
      });

      it('returns a range of dates otherwise', () => {
        const filter = {
          arguments: {
            start: mockCalendarDateColumn.rangeMin,
            end: '1500-11-01T23:59:59'
          }
        };

        const text = getFilterHumanText(filter, mockCalendarDateColumn);

        assert.include(text, 'From 12/1');
        assert.include(text, 'to 11/1');
      });
    });

    describe('numeric columns', () => {
      [mockMoneyColumn, mockNumberColumn].forEach((column) => {
        describe(column.dataTypeName, () => {
          describe('rangeInclusive', () => {
            const filter = {
              function: 'rangeInclusive',
              arguments: { start: '5', end: '6' }
            };

            it('throws if arguments are not strings', () => {
              assert.throws(() => {
                getFilterHumanText(_.set(_.cloneDeep(filter), 'arguments.start', 5), column);
                getFilterHumanText(_.set(_.cloneDeep(filter), 'arguments.end', 6), column);
              });
            });

            it('throws if start or end are not set', () => {
              assert.throws(() => {
                getFilterHumanText(
                  {
                    ...filter,
                    arguments: _.omit(filter.arguments, 'start')
                  },
                  column
                );
                getFilterHumanText(
                  {
                    ...filter,
                    arguments: _.omit(filter.arguments, 'end')
                  },
                  column
                );
              });
            });

            it('translates correctly', () => {
              assert.equal(getFilterHumanText(filter, column), '5 through 6');
            });
          });

          describe('rangeExclusive', () => {
            const filter = {
              function: 'rangeExclusive',
              arguments: { start: '5', end: '6' }
            };

            it('throws if arguments are not strings', () => {
              assert.throws(() => {
                getFilterHumanText(_.set(_.cloneDeep(filter), 'arguments.start', 5), column);
                getFilterHumanText(_.set(_.cloneDeep(filter), 'arguments.end', 6), column);
              });
            });

            it('throws if start or end are not set', () => {
              assert.throws(() => {
                getFilterHumanText(
                  {
                    ...filter,
                    arguments: _.omit(filter.arguments, 'start')
                  },
                  column
                );
                getFilterHumanText(
                  {
                    ...filter,
                    arguments: _.omit(filter.arguments, 'end')
                  },
                  column
                );
              });
            });

            it('translates correctly', () => {
              assert.equal(getFilterHumanText(filter, column), '5 to 6');
            });
          });

          // Sorry for some metatesting, but this was the cleanest way I could find to write these.
          const expectedTranslations = {
            '<': 'below 2',
            '<=': 'at most 2',
            '>': 'above 2',
            '>=': 'at least 2'
          };

          _.forOwn(expectedTranslations, (expectedTranslation, filterFunction) => {
            describe('filterFunction', () => {
              const filter = {
                function: filterFunction,
                arguments: { value: '2' }
              };

              it('throws if argument is not a string', () => {
                assert.throws(() => {
                  getFilterHumanText(_.set(_.cloneDeep(filter), 'arguments.value', 2), column);
                });
              });

              it('throws if value is not set', () => {
                assert.throws(() => {
                  getFilterHumanText(
                    {
                      ...filter,
                      arguments: {}
                    },
                    column
                  );
                });
              });

              it('translates correctly', () => {
                assert.equal(getFilterHumanText(filter, column), expectedTranslation);
              });
            });
          });

          // This type won't be generated anymore, but we must support existing usages.
          describe('valueRange', () => {
            it('returns the name of the column when the filter is a noop filter', () => {
              const selectLabel = I18n.t('shared.components.filter_bar.select');
              assert.equal(getFilterHumanText(noopFilter, column), selectLabel);
            });

            it('returns a "greater than" range when the end of the range is the max of the column', () => {
              const filter = {
                function: 'valueRange',
                arguments: {
                  start: 5,
                  end: column.rangeMax
                }
              };

              assert.equal(getFilterHumanText(filter, column), `From 5 to ${column.rangeMax}`);
            });

            it('returns a "less than" range when the start of the range is the min of the column', () => {
              const filter = {
                function: 'valueRange',
                arguments: {
                  start: column.rangeMin,
                  end: 19
                }
              };

              assert.equal(getFilterHumanText(filter, column), `From ${column.rangeMin} to 19`);
            });

            it('returns a generic range message otherwise', () => {
              const filter = {
                function: 'valueRange',
                arguments: {
                  start: 17,
                  end: 23
                }
              };

              assert.equal(getFilterHumanText(filter, column), 'From 17 to 23');
            });
          });
        });
      });
    });

    describe('text columns', () => {
      it('returns the name of the column when the filter is a noop filter', () => {
        const selectLabel = I18n.t('shared.components.filter_bar.select');
        assert.equal(getFilterHumanText(noopFilter, mockTextColumn), selectLabel);
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

        assert.equal(getFilterHumanText(filter, mockTextColumn), 'purple');
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

        assert.equal(getFilterHumanText(filter, mockTextColumn), 'Excluded purple');
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

        assert.equal(getFilterHumanText(filter, mockTextColumn), '2 selected');
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

        assert.equal(getFilterHumanText(filter, mockTextColumn), '2 excluded');
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

        assert.equal(getFilterHumanText(filter, mockTextColumn), '(No value)');
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

        assert.equal(getFilterHumanText(filter, mockTextColumn), 'Excluded (No value)');
      });
    });
  });
});
