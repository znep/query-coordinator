import { createMoneyFormatter } from 'common/visualizations/helpers/ColumnFormattingHelpers';

describe('ColumnFormattingHelpers', () => {
  describe('createMoneyFormatter(column, dataToRender)', () => {
    const dataToRender = {
      columnFormats: {
        testColumn: {
          format: {
            currency: 'CAD'
          }
        }
      }
    };

    it('formats correct precision of money values', () => {
      const formatter = createMoneyFormatter('testColumn', dataToRender);

      const raw = [0, 2e5, 4e5, 6e5, 8e5, 1e6, 1.2e6, 1.4e6];
      const expected = ['$0', '$200K', '$400K', '$600K', '$800K', '$1M', '$1.2M', '$1.4M'];

      raw.forEach((x, i) => {
        assert.equal(formatter(x), expected[i]);
      });
    });
  });
});
