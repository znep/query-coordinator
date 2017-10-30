import I18n from 'common/i18n';
import _ from 'lodash';

// Maps tags (grouping column values, column names, placeholders like (Other)) to colors.
// Has no fallback behavior.
export default class CustomPalette {
  constructor(vif, seriesIndex) {
    const currentVizType = _.get(vif, 'series[0].type');

    const columnName = currentVizType === 'pieChart' ?
      _.get(vif, 'series[0].dataSource.dimension.columnName') :
      _.get(vif, 'series[0].dataSource.dimension.grouping.columnName');

    this.series = vif.series[seriesIndex];
    this.columnName = columnName;
  }

  getColor(tagValue) {
    const color = _.get(
      this.series,
      ['color', 'customPalette', this.columnName, tagValue, 'color']
    );

    // Currently, AX generates custom palettes with nulls represented as the
    // string "(No value)". This is janky but we need to support it until we
    // make a better solution: EN-19722
    if (tagValue === null && !color) {
      return this.getColor(I18n.t('shared.visualizations.charts.common.no_value'));
    } else {
      return color;
    }
  }
}

