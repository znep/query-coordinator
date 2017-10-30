import _ from 'lodash';

import {
  DEFAULT_PRIMARY_COLOR,
  COLOR_PALETTES
} from '../../views/SvgStyleConstants';

// Palettes have a fallback behavior for when:
//   * No custom color is specified for a given item.
//   * No palette is specified at all.
//
// For some charts, the fallback scheme is to use the primary/secondary colors
// in the series configuration, and finally fall back to a hardcoded color if those
// are not specified.
//
// For other charts (pies), this fallback would result in a bunch of same-color slices.
// In that case, we should fall back straight to a color palette, ignoring primary/secondary
// colors. If all else fails and we can't even find a default color palette entry, we
// reluctantly fall back to a solid default color.
//
// It doesn't help that we've been generating pie charts with superfluous primary/secondary
// colors specified. These should be ignored.
export const FALLBACK_MODE = {
  ROTATION: 'ROTATION',
  SOLID_COLOR: 'SOLID_COLOR'
};

// Maps indexes into a palette to colors.
// Falls back to DEFAULT_PRIMARY_COLOR.
export default class StandardPalette {
  constructor(vif, seriesIndex, fallbackMode = FALLBACK_MODE.SOLID_COLOR) {
    this.series = vif.series[seriesIndex];
    const paletteName = _.get(this.series, 'color.palette', null);
    this.palette = paletteName ? (COLOR_PALETTES[paletteName] || COLOR_PALETTES.categorical) : null;
    this.primaryColor = _.get(this.series, 'color.primary');
    this.fallbackMode = fallbackMode;
  }

  getColor(index) {
    // TODO: Do we want to make new colors if we run out of entries in a palette?
    if (this.fallbackMode === FALLBACK_MODE.SOLID_COLOR) {
      // If a palette is set in the vif, use that (or fall back to categorical if the desired palette
      // is not available). If no palette is set, use the series primary color.
      // Failing both, use the global default.
      return (this.palette ? _.get(this.palette, index) : this.primaryColor) || DEFAULT_PRIMARY_COLOR;
    } else {
      // Similar to above, but don't fall back to primaryColor, ever. This is to work around some
      // visualizations that specify a primary color, but shouldn't ever use a color for more
      // than one index (like pie charts).
      // We fall back to a solid DEFAULT_PRIMARY_COLOR if we run out of palette entries - see TODO
      // at the beginning of this method.
      return _.get(this.palette || COLOR_PALETTES.categorical, index) || DEFAULT_PRIMARY_COLOR;
    }
  }
}
