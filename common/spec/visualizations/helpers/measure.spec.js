import _ from 'lodash';
import Measure, { getMeasures } from 'common/visualizations/helpers/measure';
import { useTestTranslations } from 'common/i18n';

describe('Measure', () => {
  const vif = _.set({}, 'series[0]', {});
  const seriesIndex = 0;
  const measureIndex = 0;
  const tagValue = 'a tag & stuff';

  it('throws if palette is missing needed API', () => {
    assert.throws(() => new Measure({ vif, seriesIndex, measureIndex, tagValue, palette: 'nope' }));
  });
  it('defaults labelHtml to an escaped tagValue', () => {
    const m = new Measure({ vif, seriesIndex, measureIndex, tagValue });
    assert.equal(m.labelHtml, 'a tag &amp; stuff');
  });

  describe('getColor', () => {
    it('delegates to its palette', () => {
      const palette = {
        getColor: sinon.stub().returns('foo')
      };
      const m = new Measure({ vif, seriesIndex, measureIndex, tagValue, palette });
      const dimensionIndex = 99;
      const data = 'some data';
      assert.equal(m.getColor(dimensionIndex, data), 'foo');
      sinon.assert.calledWithExactly(palette.getColor, m, dimensionIndex, data);
    });
  });
});

describe('getMeasures', () => {
  describe('multiseries chart', () => {
    const vif = { series: [
      _.set({}, 'dataSource.measure.columnName', 'whoo_columns'),
      _.set({}, 'dataSource.measure.columnName', 'whoo_columns_but_no_name_defined'),
      { } // Represents a Count Of series.
    ]};
    const chart = {
      getVif: () => vif,
      isGrouping: () => false,
      isMultiSeries: () => true
    };

    it('maps each measure column to a measure with correct properties', () => {
      // Yes, the string key is surprising. See the comment in the product code.
      // Yes, I'd expect no_value to map to something else, but it doesn't.
      useTestTranslations(_.set({}, 'shared.visualizations.panes.data.fields.measure.no_value', 'count stub'));
      const dataToRender = {
        columns: [ 'dimension', 'whoo_columns', 'whoo_columns_but_no_name_defined', 'something' ],
        columnFormats: {
          whoo_columns: {
            name: 'whoo I love columns'
          }
        }
      };
      const measures = getMeasures(chart, dataToRender);
      assert.lengthOf(measures, 3);
      assert.propertyVal(measures[0], 'measureIndex', 0);
      assert.propertyVal(measures[0], 'seriesIndex', 0);
      assert.propertyVal(measures[0], 'tagValue', 'whoo I love columns'); // Some other column type
      assert.propertyVal(measures[1], 'measureIndex', 1);
      assert.propertyVal(measures[1], 'seriesIndex', 1);
      assert.propertyVal(measures[1], 'tagValue', 'whoo_columns_but_no_name_defined');
      assert.propertyVal(measures[2], 'measureIndex', 2);
      assert.propertyVal(measures[2], 'seriesIndex', 2);
      assert.propertyVal(measures[2], 'tagValue', 'count stub'); // Count measure
    });
  });
  describe('grouped chart', () => {
    const vif = _.set({}, 'series[0].dataSource.dimension.grouping.columnName', 'group_col');
    const chart = {
      getVif: () => vif,
      isGrouping: () => true,
      isMultiSeries: () => false
    };

    it('maps each measure column to a measure with correct properties', () => {
      const dataToRender = {
        columns: [ 'dimension', 'hello <', 'goodbye' ],
        columnFormats: {
          group_col: {
            renderTypeName: 'text'
          }
        }
      };
      const measures = getMeasures(chart, dataToRender);
      assert.lengthOf(measures, 2);
      assert.propertyVal(measures[0], 'measureIndex', 0);
      assert.propertyVal(measures[0], 'seriesIndex', 0);
      assert.propertyVal(measures[0], 'tagValue', 'hello <');
      assert.propertyVal(measures[0], 'labelHtml', 'hello &lt;');
      assert.propertyVal(measures[1], 'measureIndex', 1);
      assert.propertyVal(measures[1], 'seriesIndex', 0);
      assert.propertyVal(measures[1], 'tagValue', 'goodbye');
      assert.propertyVal(measures[1], 'labelHtml', 'goodbye');
    });

    it('maps each measure column to a measure with correct properties and renders dates', () => {
      const dataToRender = {
        columns: [ 'dimension', '2017-10-26T03:27:49.970', '2017-10-28T03:27:49.970' ],
        columnFormats: {
          group_col: {
            renderTypeName: 'calendar_date'
          }
        }
      };
      const measures = getMeasures(chart, dataToRender);
      assert.lengthOf(measures, 2);
      assert.propertyVal(measures[0], 'measureIndex', 0);
      assert.propertyVal(measures[0], 'seriesIndex', 0);
      assert.propertyVal(measures[0], 'tagValue', '2017-10-26T03:27:49.970');
      assert.propertyVal(measures[0], 'labelHtml', '2017 Oct 26 03:27:49 AM');
      assert.propertyVal(measures[1], 'measureIndex', 1);
      assert.propertyVal(measures[1], 'seriesIndex', 0);
      assert.propertyVal(measures[1], 'tagValue', '2017-10-28T03:27:49.970');
      assert.propertyVal(measures[1], 'labelHtml', '2017 Oct 28 03:27:49 AM');
    });
  });
  describe('single series plain chart', () => {
    const vif = _.set({}, 'series[0]', {});
    const chart = {
      getVif: () => vif,
      isGrouping: () => false,
      isMultiSeries: () => false
    };

    it('maps each measure column to a measure with correct measureIndex and seriesIndex of 0', () => {
      const dataToRender = {
        // Only one measure is going to be passed in practice, but we check multiples anyway
        columns: [ 'dimension', null, null ] // Yes, charts use null columns to represent measures :/
      };
      const measures = getMeasures(chart, dataToRender);
      assert.lengthOf(measures, 2);
      assert.propertyVal(measures[0], 'measureIndex', 0);
      assert.propertyVal(measures[0], 'seriesIndex', 0);
      assert.propertyVal(measures[1], 'measureIndex', 1);
      assert.propertyVal(measures[1], 'seriesIndex', 0);
    });
    it('throws if too few values are provided in the rows array', () => {
      const badData = {
        // Two measures
        columns: [ 'dimension', null, null ],
         // One value
        rows: [
          [ 'dim_value', 2 ]
        ]
      };

      assert.throws(() => getMeasures(chart, badData));
    });
    it('does not throw if too may values are provided in the rows array', () => {
      const badData = {
        // Two measures
        columns: [ 'dimension', null, null ],
         // three value
        rows: [
          [ 'dim_value', 2, 3, 4 ]
        ]
      };

      getMeasures(chart, badData);
    });
  });
});
