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
    return _.get(
      this.series,
      ['color', 'customPalette', this.columnName, tagValue, 'color']
    );
  }
}

