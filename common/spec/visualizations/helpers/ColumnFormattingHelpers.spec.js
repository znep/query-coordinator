import { createMoneyFormatter } from 'common/visualizations/helpers/ColumnFormattingHelpers';

describe('ColumnFormattingHelpers', () => {
  describe('createMoneyFormatter(column, dataToRender)', () => {

    const mockData = (format) => {
      return {
        columnFormats: {
          testColumn: { format }
        }
      };
    };

    it('formats correct precision of money values', () => {
      const dataToRender = mockData({ currency: 'USD' });
      const formatter = createMoneyFormatter('testColumn', dataToRender);

      const raw = [0, 2e5, 4e5, 6e5, 8e5, 1e6, 1.2e6, 1.4e6];
      const expected = ['$0', '$200K', '$400K', '$600K', '$800K', '$1M', '$1.2M', '$1.4M'];

      raw.forEach((x, i) => {
        assert.equal(formatter(x), expected[i]);
      });
    });

    it('formats currency with matching symbol', () => {
      let dataToRender = mockData({ currency: 'GBP' });
      let formatter = createMoneyFormatter('testColumn', dataToRender);

      assert.equal(formatter(2e5), '£200K');

      dataToRender = mockData({ currency: 'EUR' });
      formatter = createMoneyFormatter('testColumn', dataToRender);

      assert.equal(formatter(2e5), '€200K');
    });

    it('formats currencyStyle with matching symbol', () => {
      let dataToRender = mockData({ currencyStyle: 'GBP' });
      let formatter = createMoneyFormatter('testColumn', dataToRender);

      assert.equal(formatter(2e5), '£200K');

      dataToRender = mockData({ currencyStyle: 'EUR' });
      formatter = createMoneyFormatter('testColumn', dataToRender);

      assert.equal(formatter(2e5), '€200K');
    });

  });
});
