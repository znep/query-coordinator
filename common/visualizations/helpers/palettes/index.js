import _ from 'lodash';
import utils from 'common/js_utils';
import StandardPalette, { FALLBACK_MODE } from './standard_palette';
import CustomPalette from './custom_palette';

// Represents a color variation scheme.
// Some charts change element colors by measure (i.e., by column).
// Others change element colors by dimension (i.e., by row).
export const COLOR_VARY_BY = {
  DIMENSION: 'DIMENSION', // like a pie chart.
  MEASURE: 'MEASURE' // like a bar chart.
};

// Represents a palette defined on a particular series in a VIF.
//
// Reconciles custom palettes being by value where normal palettes are by
// index.
export default class Palette {
  constructor({ vif, seriesIndex, colorVaryBy = COLOR_VARY_BY.MEASURE }) {
    utils.assert(_.isPlainObject(vif), 'vif must be a plain object');
    this.colorVaryBy = colorVaryBy;
    this.series = vif.series[seriesIndex];
    this.customPalette = new CustomPalette(vif, seriesIndex);
    this.standardPalette = new StandardPalette(
      vif,
      seriesIndex,
      colorVaryBy === COLOR_VARY_BY.MEASURE ? FALLBACK_MODE.SOLID_COLOR : FALLBACK_MODE.ROTATION
    );
  }

  getColor(measure, dimensionIndex, data) {
    const palette = _.get(this.series, 'color.palette', null);

    // Looks up standard palettes via measureIndex, and custom palettes with
    // measure tagValues.
    if (this.colorVaryBy === COLOR_VARY_BY.MEASURE) {
      const standardColor = this.standardPalette.getColor(measure.measureIndex);
      if (palette === 'custom') {
        return this.customPalette.getColor(measure.tagValue) || standardColor;
      } else {
        return standardColor;
      }
    }

    // Looks up standard palettes via dimensionIndex, and custom palettes with
    // row data.
    if (this.colorVaryBy === COLOR_VARY_BY.DIMENSION) {
      // If hit, check that your chart is passing dimensionIndex and data.
      // Currently, only COLOR_VARY_BY.DIMENSION charts need to.
      utils.assertIsNumber(dimensionIndex);

      const standardColor = this.standardPalette.getColor(dimensionIndex);
      if (palette === 'custom') {
        return this.customPalette.getColor(data) || standardColor;
      } else {
        return standardColor;
      }
    }
  }
}

