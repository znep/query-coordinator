import _ from 'lodash';
import StandardPalette, { FALLBACK_MODE } from 'common/visualizations/helpers/palettes/standard_palette';

import {
  DEFAULT_PRIMARY_COLOR,
  COLOR_PALETTES
} from 'common/visualizations/views/SvgStyleConstants';

describe('StandardPalette', () => {
  it('defaults to fallbackMode = SOLID_COLOR', () => {
    const vif = { series: [] };
    const p = new StandardPalette(vif, 0);
    assert.equal(p.fallbackMode, FALLBACK_MODE.SOLID_COLOR);
  });

  describe('fallbackMode = SOLID_COLOR', () => {
    describe('palette set to valid value and primaryColor set to a valid value', () => {
      const vif = _.set({}, 'series[0].color.palette', 'categorical');
      const p = new StandardPalette(vif, 0);
      it('given an in-range index returns the corresponding palette entry', () => {
        assert.equal(p.getColor(0), COLOR_PALETTES.categorical[0]);
        assert.equal(p.getColor(1), COLOR_PALETTES.categorical[1]);
      });
      it('given an out-of-range index returns the default color', () => {
        assert.equal(p.getColor(999), DEFAULT_PRIMARY_COLOR);
      });
    });

    describe('palette set to valid value and primaryColor set to a valid value', () => {
      const vif = _.set({}, 'series[0].color.palette', 'categorical');
      _.set(vif, 'series[0].color.primary', '#f0f');
      const p = new StandardPalette(vif, 0);
      it('given an in-range index returns the corresponding palette entry', () => {
        assert.equal(p.getColor(0), COLOR_PALETTES.categorical[0]);
        assert.equal(p.getColor(1), COLOR_PALETTES.categorical[1]);
      });
      // This is somewhat unintuitive. We want the palette to _override_ the primaryColor.
      it('given an out-of-range index returns the default color', () => {
        assert.equal(p.getColor(999), DEFAULT_PRIMARY_COLOR);
      });
    });

    describe('palette set to invalid value and primaryColor set to a valid value', () => {
      const vif = _.set({}, 'series[0].color.palette', 'woah there');
      _.set(vif, 'series[0].color.primary', '#f0f');
      const p = new StandardPalette(vif, 0);
      it('defaults the palette to categorical', () => {
        assert.equal(p.getColor(0), COLOR_PALETTES.categorical[0]);
        assert.equal(p.getColor(1), COLOR_PALETTES.categorical[1]);
      });
      // This is somewhat unintuitive. We want the palette to _override_ the primaryColor.
      it('given an out-of-range index returns the default color', () => {
        assert.equal(p.getColor(999), DEFAULT_PRIMARY_COLOR);
      });
    });

    describe('palette unset and primaryColor set to a valid value', () => {
      const vif = _.set({}, 'series[0].color.primary', '#f0f');
      const p = new StandardPalette(vif, 0);
      it('returns the primary color', () => {
        assert.equal(p.getColor(0), '#f0f');
        assert.equal(p.getColor(1), '#f0f');
        assert.equal(p.getColor(999), '#f0f');
      });
    });

    describe('palette unset and primaryColor unset', () => {
      const vif = { series: [] };
      const p = new StandardPalette(vif, 0);
      it('returns the default color', () => {
        assert.equal(p.getColor(0), DEFAULT_PRIMARY_COLOR);
        assert.equal(p.getColor(1), DEFAULT_PRIMARY_COLOR);
        assert.equal(p.getColor(999), DEFAULT_PRIMARY_COLOR);
      });
    });
  });

  describe('fallbackMode = ROTATION', () => {
    describe('palette set to valid value and primaryColor set to a valid value', () => {
      const vif = _.set({}, 'series[0].color.palette', 'categorical');
      const p = new StandardPalette(vif, 0, FALLBACK_MODE.ROTATION);
      it('given an in-range index returns the corresponding palette entry', () => {
        assert.equal(p.getColor(0), COLOR_PALETTES.categorical[0]);
        assert.equal(p.getColor(1), COLOR_PALETTES.categorical[1]);
      });
      it('given an out-of-range index returns the default color', () => {
        assert.equal(p.getColor(999), DEFAULT_PRIMARY_COLOR);
      });
    });

    describe('palette set to valid value and primaryColor set to a valid value', () => {
      const vif = _.set({}, 'series[0].color.palette', 'categorical');
      _.set(vif, 'series[0].color.primary', '#f0f');
      const p = new StandardPalette(vif, 0, FALLBACK_MODE.ROTATION);
      it('given an in-range index returns the corresponding palette entry', () => {
        assert.equal(p.getColor(0), COLOR_PALETTES.categorical[0]);
        assert.equal(p.getColor(1), COLOR_PALETTES.categorical[1]);
      });
      // This is somewhat unintuitive. We want the palette to _override_ the primaryColor.
      it('given an out-of-range index returns the default color', () => {
        assert.equal(p.getColor(999), DEFAULT_PRIMARY_COLOR);
      });
    });

    describe('palette set to invalid value and primaryColor set to a valid value', () => {
      const vif = _.set({}, 'series[0].color.palette', 'woah there');
      _.set(vif, 'series[0].color.primary', '#f0f');
      const p = new StandardPalette(vif, 0, FALLBACK_MODE.ROTATION);
      it('defaults the palette to categorical', () => {
        assert.equal(p.getColor(0), COLOR_PALETTES.categorical[0]);
        assert.equal(p.getColor(1), COLOR_PALETTES.categorical[1]);
      });
      // This is somewhat unintuitive. We want the palette ignore the primaryColor
      it('given an out-of-range index returns the default color', () => {
        assert.equal(p.getColor(999), DEFAULT_PRIMARY_COLOR);
      });
    });

    describe('palette unset and primaryColor set to a valid value', () => {
      const vif = _.set({}, 'series[0].color.primary', '#f0f');
      const p = new StandardPalette(vif, 0, FALLBACK_MODE.ROTATION);
      // This is somewhat unintuitive. We want the palette ignore the primaryColor
      it('defaults the palette to categorical', () => {
        assert.equal(p.getColor(0), COLOR_PALETTES.categorical[0]);
        assert.equal(p.getColor(1), COLOR_PALETTES.categorical[1]);
      });
    });

    describe('palette unset and primaryColor unset', () => {
      const vif = { series: [] };
      const p = new StandardPalette(vif, 0, FALLBACK_MODE.ROTATION);
      it('defaults the palette to categorical', () => {
        assert.equal(p.getColor(0), COLOR_PALETTES.categorical[0]);
        assert.equal(p.getColor(1), COLOR_PALETTES.categorical[1]);
      });
    });
  });
});
