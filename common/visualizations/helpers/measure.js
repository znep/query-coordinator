import _ from 'lodash';

import utils from 'common/js_utils';
import I18n from 'common/i18n';

import { formatValueHTML } from './ColumnFormattingHelpers';
import Palette from './palettes';

// Represents a measure viewmodel for rendering purposes.
// You probably don't want to instantiate this directly - use getMeasures instead!
export default class Measure {
  constructor({
    vif,
    seriesIndex,
    measureIndex,
    // The measure's tag, used to uniquely identify it. Currently used to look up custom palette
    // entries.
    //
    // In grouping scenarios, the value of the group. For example, if grouping a crimes dataset
    // by Crime Type, tagValue might take on the value "burglary". Note that this may be null.
    // In multiseries scenarios, this is the series name (usually the dataset column name).
    //
    // Note that some charts (pie charts, for instance) vary the color based on row, not column.
    // In that case, this value may be unused.
    tagValue,

    // HTML which represents this Measure in i.e. a legend or flyout.
    labelHtml = _.escape(tagValue),

    // Palette used to render the measure.
    palette = new Palette({ vif, seriesIndex })
  }) {
    utils.assert(
      _.isPlainObject(vif),
      'vif must be a plain object'
    );
    utils.assertIsNumber(seriesIndex);
    utils.assertIsNumber(measureIndex);
    utils.assertIsOneOfTypes(labelHtml, 'string', 'undefined');
    utils.assert(!!palette, 'A palette object must be provided');
    utils.assert(
      _.isFunction(palette.getColor),
      'palette lacks a getColor function - did you mean to pass a Palette instance?'
    );

    this.measureIndex = measureIndex;
    this.seriesIndex = seriesIndex;
    this.labelHtml = labelHtml;
    this.palette = palette;
    this.tagValue = tagValue;
  }

  /**
   * Obtains the color of this measure by looking it up in the VIF
   *
   * @param dimensionIndex: Optional, pass if using a palette which needs it.
   * @param data: Optional, pass if using a palette which needs it.
   */
  getColor(dimensionIndex, data) {
    return this.palette.getColor(this, dimensionIndex, data);
  }
}

export const getMeasures = (chart, dataToRender) => {
  utils.assertHasProperty(dataToRender, 'columns');

  const vif = chart.getVif();
  const dataTableDimensionIndex = dataToRender.columns.indexOf('dimension');
  const columns = dataToRender.columns.slice(dataTableDimensionIndex + 1);

  if (chart.hasMultipleNonFlyoutSeries() || chart.hasFlyoutSeries()) {
    // This is actually "(Count of Rows)". While the behavior is correct (Count of Rows shows
    // up in the flyout), it's very confusing. Not to be confused with
    // 'shared.visualizations.charts.common.no_value'
    const countOfLabel = I18n.t('shared.visualizations.panes.data.fields.measure.no_value');

    utils.assertHasProperty(dataToRender, 'columnFormats');
    utils.assert(columns.length >= vif.series.length, 'Multi Series chart given too few columns.');
    return columns.map((column, seriesIndex) => {
      const measureColumnName = _.get(vif, `series[${seriesIndex}].dataSource.measure.columnName`);
      if (_.isEmpty(measureColumnName)) {
        return new Measure({
          vif,
          seriesIndex,
          measureIndex: seriesIndex, // Yes, these are linked together.
          // TODO Relying on an i18n value for VIF configuration is unwise. We should
          // use a better sentinel value.
          tagValue: countOfLabel
        });
      }

      const measureColumnFormat = dataToRender.columnFormats[measureColumnName];
      const label = _.isUndefined(measureColumnFormat) ? column : measureColumnFormat.name;

      return new Measure({
        vif,
        seriesIndex,
        measureIndex: seriesIndex, // Yes, these are linked together.
        tagValue: label
      });
    });
  } else if (chart.isGrouping()) {
    // Grouped column charts will have multiple columns. If one of those columns is null (which is
    // a valid value for it to be if there are nulls in the dataset), we need to replace it with
    // the no value label. If there are not multiple columns, that's an expected null that we
    // should not overwrite with the no value label.

    const noValueLabel = I18n.t('shared.visualizations.charts.common.no_value');
    const groupingColumnName = _.get(
      vif,
      'series[0].dataSource.dimension.grouping.columnName'
    );
    return columns.map((column, measureIndex) => {
      // NOTE: the variable `column` holds a value from the grouping column.
      const labelHtml = column ?
        formatValueHTML(column, groupingColumnName, dataToRender) :
        noValueLabel;
      return new Measure({
        vif,
        seriesIndex: 0,
        measureIndex,
        tagValue: column,
        labelHtml
      });
    });
  } else {
    const firstRowLength = _.get(dataToRender, 'rows[0].length');
    if (_.isFinite(firstRowLength)) {
      const measureCount = firstRowLength - dataTableDimensionIndex - 1;
      utils.assert(
        columns.length <= measureCount,
        `Chart given too few values in rows. Expected: ${columns.length}, Actual: ${measureCount}`
      );
    }
    return columns.map((column, measureIndex) => {
      return new Measure({
        vif,
        seriesIndex: 0,
        measureIndex
      });
    });
  }
};
