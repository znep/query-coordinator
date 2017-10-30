import _ from 'lodash';
const CategoricalDataManager = require('./CategoricalDataManager');
const TimeDataManager = require('./TimeDataManager');
import { assert } from 'common/js_utils';
import { COLOR_PALETTE_VALUES } from '../../authoring_workflow/constants';
import * as selectors from '../../authoring_workflow/selectors/vifAuthoring';
import I18n from 'common/i18n';

/**
 * Returns either a default or modified custom color palette.
 *
 * This is handled separately for pieCharts vs barChart/columnChart/timelineChart
 * because pieCharts assign palette colors to the columnNames found in
 * series[0].dataSource.dimension.columnName and the values to group are returned
 * from the CategoricalDataManager in result.rows, whereas barChart, columnChart,
 * and timelineChart use series[0].dataSource.dimension.grouping.columnName
 * and their data managers return the values to group as result.columns.
 *
 * @param {Object} newVif
 * @return {Promise}
 */
const generateCustomColorPalette = (vifAuthoring) => {
  const newVif = _.cloneDeep(selectors.getCurrentVif(vifAuthoring));
  const dimensionColumnName = selectors.getColorPaletteGroupingColumnName(vifAuthoring);
  const visualizationType = selectors.getSelectedVisualizationType(vifAuthoring);
  const isSupportedChartType = _.includes(['pieChart', 'barChart', 'columnChart', 'timelineChart'], visualizationType);
  const customPalette = selectors.getCustomColorPalette(vifAuthoring);
  const currentPalette = _.has(customPalette, dimensionColumnName) ?
    customPalette[dimensionColumnName] :
    {};
  const baseColorPalette = 'categorical';

  assert(
    isSupportedChartType && !_.isNil(dimensionColumnName),
    'To create a custom color palette you need a valid chart type and custom palette configuration'
  );

  if (_.includes(['barChart', 'columnChart', 'timelineChart'], visualizationType)) {
    const getData = visualizationType === 'timelineChart' ?
      TimeDataManager.getData :
      CategoricalDataManager.getData;

    _.set(
      newVif,
      'series[0].dataSource.dimension.grouping.columnName',
      dimensionColumnName
    );

    return getData(newVif).then((result) => {
      // Slicing the result because the first index is 'dimension' which is not a group name
      const groups = _.slice(result.columns, 1);
      // Reset the indices of the currentPalette groups to -1 before reassigning them
      // An index of -1 makes it so the group is not displayed in the custom color palette list
      const customColorPalette = _.reduce(currentPalette, (accumulator, value, key) => {
        accumulator[key] = _.cloneDeep(value);
        accumulator[key].index = -1;
        return accumulator;
      }, {});

      _.forEach(groups, (group, index) => {
        if (_.isNull(group)) {
          group = I18n.t('shared.visualizations.charts.common.no_value');
        }

        const color = _.has(currentPalette, group) ?
            currentPalette[group].color :
            COLOR_PALETTE_VALUES[baseColorPalette][index];

        customColorPalette[group] = { color, index };
      });

      return { customColorPalette, dimensionColumnName };
    });
  } else if (visualizationType === 'pieChart') {
    _.set(
      newVif,
      'series[0].dataSource.dimension.columnName',
      dimensionColumnName
    );

    return Promise.resolve(CategoricalDataManager.getData(newVif).then((result) => {
      let offset = 0;
      const groups = result.rows;
      const lastIndexInGroups = _.keys(groups).length - 1;
      // Reset the indices of the currentPalette groups to -1 before reassigning them
      // An index of -1 makes it so the group is not displayed in the custom color palette list
      const customColorPalette = _.reduce(currentPalette, (accumulator, value, key) => {
        accumulator[key] = _.cloneDeep(value);
        accumulator[key].index = -1;
        return accumulator;
      }, {});

      _.forEach(groups, (group, groupIndex) => {
        let index;
        let [groupName] = group;

        if (_.isNull(groupName)) {
          groupName = I18n.t('shared.visualizations.charts.common.no_value');
        }

        // This inserts the `(Other)` group at the end of the customColorPalette
        if (groupName === I18n.t('shared.visualizations.charts.common.other_category')) {
          index = lastIndexInGroups;
          offset = 1;
        } else {
          index = groupIndex - offset;
        }

        const color = _.has(currentPalette, groupName) ?
          currentPalette[groupName].color :
          COLOR_PALETTE_VALUES[baseColorPalette][index];
        customColorPalette[groupName] = { color, index };
      });

      return { customColorPalette, dimensionColumnName };
    }));
  } else {
    return Promise.reject(new Error(`Custom color palette not supported for chart type : ${visualizationType}`));
  }
};

module.exports = {
  generateCustomColorPalette
};
