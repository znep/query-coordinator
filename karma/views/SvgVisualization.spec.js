const _ = require('lodash');
const $ = require('jquery');
const rewire = require('rewire');

import mockVif from '../mockVif';
const SvgVisualization = rewire('src/views/SvgVisualization.js');

describe('SvgVisualization', () => {
  let $element;

  // Returns the outermost node of the rendered visualization.
  function getViz() {
    return $element.children().first();
  }

  beforeEach(() => {
    $element = $('<div>');
  });

  describe('on instantiation', () => {

  });

  describe('#getVif', () => {

  });

  describe('#updateVif', () => {

  });

  describe('#renderTitle', () => {

  });

  describe('#renderDescription', () => {

  });

  describe('#renderAxisLabels', () => {

  });

  describe('#renderError', () => {

  });

  describe('#clearError', () => {

  });

  describe('#showBusyIndicator', () => {

  });

  describe('#hideBusyIndicator', () => {

  });

  describe('#showViewSourceDataLink', () => {
    let __reset__;

    function validateLink(expectedURL) {
      const rendered = getViz();
      assert.isTrue(rendered.hasClass('socrata-visualization-view-source-data'));
      assert.equal(
        rendered.find('.socrata-visualization-view-source-data a').attr('href'),
        expectedURL
      );
    }

    afterEach(() => __reset__());

    describe('when migration data exists', () => {
      beforeEach(() => {
        __reset__ = SvgVisualization.__set__({
          MetadataProvider: function() {
            this.getDatasetMigrationMetadata = () => Promise.resolve({ nbe_id: 'nbe4-four' });
          }
        });
      });

      it('renders a source data link', (done) => {
        const viz = new SvgVisualization($element, mockVif);
        viz.showViewSourceDataLink();

        setTimeout(() => {
          validateLink('https://vertex-stories.test-socrata.com/d/nbe4-four')
          done();
        }, 1);
      });

      it('adds a query string parameter when embedded', (done) => {
        $element.addClass('socrata-visualization-embed');

        const viz = new SvgVisualization($element, mockVif);
        viz.showViewSourceDataLink();

        setTimeout(() => {
          validateLink('https://vertex-stories.test-socrata.com/d/nbe4-four?referrer=embed');
          done();
        }, 1);
      });
    });

    describe('when migration data does not exist', () => {
      beforeEach(() => {
        __reset__ = SvgVisualization.__set__({
          MetadataProvider: function() {
            this.getDatasetMigrationMetadata = () => Promise.reject();
          }
        });
      });

      it('renders a source data link', (done) => {
        const viz = new SvgVisualization($element, mockVif);
        viz.showViewSourceDataLink();

        setTimeout(() => {
          validateLink('https://vertex-stories.test-socrata.com/d/k6cs-ww27');
          done();
        }, 1);
      });

      it('adds a query string parameter when embedded', (done) => {
        $element.addClass('socrata-visualization-embed');

        const viz = new SvgVisualization($element, mockVif);
        viz.showViewSourceDataLink();

        setTimeout(() => {
          validateLink('https://vertex-stories.test-socrata.com/d/k6cs-ww27?referrer=embed');
          done();
        }, 1);
      });
    });
  });

  describe('#hideViewSourceDataLink', () => {

  });

  describe('#showPanningNotice', () => {

  });

  describe('#hidePanningNotice', () => {

  });

  describe('#showInfo', () => {

  });

  describe('#hideInfo', () => {

  });

  describe('#isMobile', () => {

  });

  describe('#isMultiSeries', () => {

  });

  describe('#getSeriesIndexByLabel', () => {

  });

  describe('#getTypeVariantBySeriesIndex', () => {

  });

  describe('#getUnitOneBySeriesIndex', () => {

  });

  describe('#getUnitOtherBySeriesIndex', () => {

  });

  describe('#getPrimaryColorBySeriesIndex', () => {

  });

  describe('#getSecondaryColorBySeriesIndex', () => {

  });

  describe('#getHighlightColorBySeriesIndex', () => {

  });

  describe('#getXAxisScalingModeBySeriesIndex', () => {

  });

  describe('#getColorPaletteBySeriesIndex', () => {

  });

  describe('#getYAxisScalingMode', () => {

  });

  describe('#getMeasureAxisMinValue', () => {

  });

  describe('#getMeasureAxisMaxValue', () => {

  });

  describe('#getShowDimensionLabels', () => {

  });

  describe('#getShowValueLabels', () => {

  });

  describe('#getShowValueLabelsAsPercent', () => {

  });

  describe('#emitEvent', () => {

  });

});
