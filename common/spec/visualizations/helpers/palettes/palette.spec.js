import _ from 'lodash';
import Palette, { COLOR_VARY_BY } from 'common/visualizations/helpers/palettes';
import { FALLBACK_MODE } from 'common/visualizations/helpers/palettes/standard_palette';

describe('Palette', () => {
  const measure = { tagValue: 'atag', measureIndex: 99 };

  it('defaults to colorVaryBy = MEASURE', () => {
    const vif = { series: [] };
    const p = new Palette({ vif, seriesIndex: 0 });
    assert.equal(p.colorVaryBy, COLOR_VARY_BY.MEASURE);
  });

  describe('colorVaryBy = MEASURE', () => {
    it('passes FALLBACK_MODE = SOLID_COLOR to StandardPalette', () => {
      const vif = { series: [] };
      const p = new Palette({ vif, seriesIndex: 0 });
      assert.equal(p.standardPalette.fallbackMode, FALLBACK_MODE.SOLID_COLOR);
    });
    describe('getColor', () => {
      describe('palette set to a standard value', () => {
        const vif = _.set({}, 'series[0].color.palette', 'categorical');
        it('delegates to standardPalette only', () => {
          const p = new Palette({ vif, seriesIndex: 0 });
          const standardPaletteStub = sinon.stub(p.standardPalette, 'getColor').returns('standard');
          const customPaletteStub = sinon.stub(p.customPalette, 'getColor');
          assert.equal(p.getColor(measure), 'standard');
          sinon.assert.notCalled(customPaletteStub);
          sinon.assert.calledOnce(standardPaletteStub);
          sinon.assert.calledWith(standardPaletteStub, 99);
        });
      });
      describe('palette set to custom', () => {
        const vif = _.set({}, 'series[0].color.palette', 'custom');
        it('delegates to customPalette', () => {
          const p = new Palette({ vif, seriesIndex: 0 });
          const standardPaletteStub = sinon.stub(p.standardPalette, 'getColor').returns('standard');
          const customPaletteStub = sinon.stub(p.customPalette, 'getColor').returns('custom');
          assert.equal(p.getColor(measure), 'custom');
          sinon.assert.calledOnce(customPaletteStub);
          sinon.assert.calledWith(customPaletteStub, 'atag');
        });
        it('falls back to standardPalette', () => {
          const p = new Palette({ vif, seriesIndex: 0 });
          const standardPaletteStub = sinon.stub(p.standardPalette, 'getColor').returns('standard');
          const customPaletteStub = sinon.stub(p.customPalette, 'getColor').returns(undefined);
          assert.equal(p.getColor(measure), 'standard');
          sinon.assert.calledOnce(customPaletteStub);
          sinon.assert.calledWith(customPaletteStub, 'atag');
          sinon.assert.calledOnce(standardPaletteStub);
          sinon.assert.calledWith(standardPaletteStub, 99);
        });
      });
    });
  });

  describe('colorVaryBy = DIMENSION', () => {
    it('passes FALLBACK_MODE = ROTATION to StandardPalette', () => {
      const vif = { series: [] };
      const p = new Palette({ vif, seriesIndex: 0, colorVaryBy: COLOR_VARY_BY.DIMENSION });
      assert.equal(p.standardPalette.fallbackMode, FALLBACK_MODE.ROTATION);
    });
    describe('getColor', () => {
      describe('palette set to a standard value', () => {
        const vif = _.set({}, 'series[0].color.palette', 'categorical');
        it('delegates to standardPalette only', () => {
          const p = new Palette({ vif, seriesIndex: 0, colorVaryBy: COLOR_VARY_BY.DIMENSION });
          const standardPaletteStub = sinon.stub(p.standardPalette, 'getColor').returns('standard');
          const customPaletteStub = sinon.stub(p.customPalette, 'getColor');
          assert.equal(p.getColor(measure, 3, 'row data'), 'standard');
          sinon.assert.notCalled(customPaletteStub);
          sinon.assert.calledOnce(standardPaletteStub);
          sinon.assert.calledWith(standardPaletteStub, 3);
        });
      });
      describe('palette set to custom', () => {
        const vif = _.set({}, 'series[0].color.palette', 'custom');
        it('checks that dimensionIndex is a number', () => {
          const p = new Palette({ vif, seriesIndex: 0, colorVaryBy: COLOR_VARY_BY.DIMENSION });
          assert.throws(() => p.getColor(measure));
          assert.throws(() => p.getColor(measure, 'a'));
        });
        it('delegates to customPalette', () => {
          const p = new Palette({ vif, seriesIndex: 0, colorVaryBy: COLOR_VARY_BY.DIMENSION });
          const standardPaletteStub = sinon.stub(p.standardPalette, 'getColor').returns('standard');
          const customPaletteStub = sinon.stub(p.customPalette, 'getColor').returns('custom');
          assert.equal(p.getColor(measure, 3, 'row data'), 'custom');
          sinon.assert.calledOnce(customPaletteStub);
          sinon.assert.calledWith(customPaletteStub, 'row data');
        });
        it('falls back to standardPalette', () => {
          const p = new Palette({ vif, seriesIndex: 0, colorVaryBy: COLOR_VARY_BY.DIMENSION });
          const standardPaletteStub = sinon.stub(p.standardPalette, 'getColor').returns('standard');
          const customPaletteStub = sinon.stub(p.customPalette, 'getColor').returns(undefined);
          assert.equal(p.getColor(measure, 3, 'row data'), 'standard');
          sinon.assert.calledOnce(customPaletteStub);
          sinon.assert.calledWith(customPaletteStub, 'row data');
          sinon.assert.calledOnce(standardPaletteStub);
          sinon.assert.calledWith(standardPaletteStub, 3);
        });
      });
    });
  });
});
