import _ from 'lodash';
import CustomPalette from 'common/visualizations/helpers/palettes/custom_palette';

describe('CustomPalette', () => {
  const vif = _.set({}, 'series[0].color.customPalette', {
    grouped_column: {
      groupTag1: { color: '#fff' },
      groupTag2: { color: '#0ff' }
    },
    non_grouped_column: {
      ungroupTag1: { color: '#ff0' },
      ungroupTag2: { color: '#0f0' }
    }
  });
  _.set(vif, 'series[0].dataSource.dimension', {
    columnName: 'non_grouped_column',
    grouping: { columnName: 'grouped_column' }
  });

  // Our favorite special snowflakes!
  describe('pie charts', () => {
    const pieVif = _.set(_.cloneDeep(vif), 'series[0].type', 'pieChart');
    const p = new CustomPalette(pieVif, 0);

    it('returns custom colors only from the ungrouped column', () => {
      assert.equal(p.getColor('ungroupTag1'), '#ff0');
      assert.equal(p.getColor('ungroupTag2'), '#0f0');
      assert.isUndefined(p.getColor('groupTag1'));
      assert.isUndefined(p.getColor('groupTag2'));
    });
  });

  describe('not pie charts', () => {
    const notPieVif = _.set(_.cloneDeep(vif), 'series[0].type', 'columnChart');
    const p = new CustomPalette(notPieVif, 0);

    it('returns custom colors only from the grouped column', () => {
      assert.equal(p.getColor('groupTag1'), '#fff');
      assert.equal(p.getColor('groupTag2'), '#0ff');
      assert.isUndefined(p.getColor('ungroupTag1'));
      assert.isUndefined(p.getColor('ungroupTag2'));
    });
  });
});
