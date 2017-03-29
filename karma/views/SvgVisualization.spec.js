const _ = require('lodash');
const $ = require('jquery');
const rewire = require('rewire');
const I18n = require('../../src/I18n');
const VifHelpers = require('../../src/helpers/VifHelpers');
const SvgVisualization = rewire('src/views/SvgVisualization.js');

import {
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  DEFAULT_HIGHLIGHT_COLOR,
  COLOR_PALETTES
} from '../../src/views/SvgStyleConstants';
import mockVif from '../mockVif';
import mockMultiseriesVif from '../mockMultiseriesVif';

describe('SvgVisualization', () => {
  let $element;

  // Returns the outermost node of the rendered visualization.
  const getViz = () => $element.children().first();
  const getVizElement = () => $element.find('.socrata-visualization')[0];
  const getVizChildElement = (childClass) => $element.find(`.socrata-visualization ${childClass}`)[0];

  beforeEach(() => {
    $element = $('<div>');
  });

  afterEach(function() {
    if ($element && $element[0].hasChildNodes('.socrata-visualization')) {
      $element.trigger('SOCRATA_VISUALIZATION_DESTROY');
      assert($element.children().length === 0, 'SvgVisualization destroy event did not remove DOM');
      assert.equal(getVizElement(), undefined);
    }
  });

  describe('on instantiation', () => {

    let viz;
    const templateElementClasses = [
      '.socrata-visualization-title',
      '.socrata-visualization-description',
      // TODO: A change was made to axis title rendering in EN-11686 (frontend-visualizations/pull/495)
      //      that kept these axis elements but broke the flyouts. Need to update these
      //      tests when that is fixed (EN-15077).
      // '.socrata-visualization-top-axis-title',
      // '.socrata-visualization-right-axis-title',
      // '.socrata-visualization-bottom-axis-title',
      // '.socrata-visualization-left-axis-title'
    ];

    beforeEach(() => {
      // Titles need to exist for mouseover events to be triggered
      const newVif = _.merge({}, mockVif, {
        configuration: {
          axisLabels: {
            top: 'Top Title',
            right: 'Right Title',
            bottom: 'Bottom Title',
            left: 'Left Title'
          }
        }
      });
      viz = new SvgVisualization($element, newVif);
    });

    it('renders a DOM template from the $element', () => {
      assert.equal(viz.$element, $element);
      assert($element.children().length > 0);
      assert.isDefined(getVizElement());
    });

    for (let templateClass of templateElementClasses) {
      it(`attaches a showFlyout event on mouseover for element with class ${templateClass}`, (done) => {
        const mouseoverElement = getVizChildElement(templateClass);
        $element.on('SOCRATA_VISUALIZATION_FLYOUT', (event) => {
          const payload = event.detail;
          assert.equal(payload.element, mouseoverElement);
          assert.equal(payload.content.text(), mouseoverElement.getAttribute('data-full-text'));
          done();
        });
        $(mouseoverElement).trigger('mouseover');
      });
    }

    for (let templateClass of templateElementClasses) {
      it(`attaches a hideFlyout event on mouseout for element with class ${templateClass}`, (done) => {
        const mouseoutElement = getVizChildElement(templateClass);

        $element.on('SOCRATA_VISUALIZATION_FLYOUT', (event) => {
          const payload = event.detail;
          assert.isNull(payload);
          done();
        });
        $(mouseoutElement).trigger('mouseout');
      });
    }

    it('attaches a destroy event to remove the DOM template', (done) => {
      $element.on('SOCRATA_VISUALIZATION_DESTROY', function(event) {
        assert.isUndefined(getVizElement());
        done();
      });

      assert.isDefined(getVizElement());
      $element.trigger('SOCRATA_VISUALIZATION_DESTROY');
    });
  });

  describe('#updateVif', () => {
    let viz;

    beforeEach(() => {
      viz = new SvgVisualization($element, mockVif);
    });

    it('combines a vif with a default vif', () => {
      const mergedVif = _.merge({},
        VifHelpers.getDefaultVif(),
        VifHelpers.migrateVif(mockVif)
      );
      const renderedVif = viz.getVif();
      assert.notDeepEqual(renderedVif, mockVif);
      assert.deepEqual(renderedVif, mergedVif);
    });

    it('can replace a previously rendered vif', () => {
      const originalVif = viz.getVif();
      const newVif = _.merge({}, originalVif, {
        description: 'Bananas in Space'
      });

      viz.updateVif(newVif);
      const updatedVif = viz.getVif();
      assert.deepEqual(updatedVif, newVif);
    });
  });

  describe('#renderTitle', () => {
    let viz;

    beforeEach(() => {
      viz = new SvgVisualization($element, mockVif);
    });

    it('renders the original title during initialization', () => {
      const title = getVizChildElement('.socrata-visualization-title');
      assert.equal(title.innerHTML, mockVif.title);
    });

    it('adds title class to the container when title present', () => {
      assert.isTrue(getViz().hasClass('socrata-visualization-title'));

      const originalVif = viz.getVif();
      const newVif = _.merge({}, originalVif, {
        title: ''
      });
      viz.updateVif(newVif);

      assert.isNotTrue(getViz().hasClass('socrata-visualization-title'));
    });

    it('renders an updated title', () => {
      const originalVif = viz.getVif();
      const newVif = _.merge({}, originalVif, {
        title: 'New Title'
      });

      viz.updateVif(newVif);
      const title = getVizChildElement('.socrata-visualization-title');
      assert.equal(title.innerHTML, 'New Title');
    });
  });

  describe('#renderDescription', () => {
    let viz;

    beforeEach(() => {
      viz = new SvgVisualization($element, mockVif);
    });

    it('renders the original description during initialization', () => {
      const description = getVizChildElement('.socrata-visualization-description');
      assert.equal(description.innerHTML, mockVif.description);
    });

    it('adds description class to container when description present', () => {
      assert.isTrue(getViz().hasClass('socrata-visualization-description'));

      const originalVif = viz.getVif();
      const newVif = _.merge({}, originalVif, {
        description: ''
      });
      viz.updateVif(newVif);

      assert.isNotTrue(getViz().hasClass('socrata-visualization-description'));
    });

    it('renders an updated description', () => {
      const originalVif = viz.getVif();
      const newVif = _.merge({}, originalVif, {
        description: 'New Description'
      });

      viz.updateVif(newVif);
      const description = getVizChildElement('.socrata-visualization-description');
      assert.equal(description.innerHTML, 'New Description');
    });
  });

  // TODO: A change was made to axis title rendering in EN-11686 (frontend-visualizations/pull/495)
  //      that moved axis title rendering to the svg but kept the original axis title elements in place.
  //      Need to fix these tests when that is updated (EN-15077).
  xdescribe('#renderAxisLabels', () => {
    let viz;

    beforeEach(() => {
      viz = new SvgVisualization($element, mockVif);
    });

    it('does not render axis labels if they are not specified in the vif', () => {
      const viz = new SvgVisualization($element, mockVif);

      const topAxisTitle = getVizChildElement('.socrata-visualization-top-axis-title').innerHTML;
      const rightAxisTitle = getVizChildElement('.socrata-visualization-right-axis-title').innerHTML;
      const bottomAxisTitle = getVizChildElement('.socrata-visualization-bottom-axis-title').innerHTML;
      const leftAxisTitle = getVizChildElement('.socrata-visualization-left-axis-title').innerHTML;

      assert.isNotTrue(getViz().hasClass('socrata-visualization-top-axis-title'));
      assert.isNotTrue(getViz().hasClass('socrata-visualization-right-axis-title'));
      assert.isNotTrue(getViz().hasClass('socrata-visualization-bottom-axis-title'));
      assert.isNotTrue(getViz().hasClass('socrata-visualization-left-axis-title'));
      assert.equal(topAxisTitle, '');
      assert.equal(rightAxisTitle, '');
      assert.equal(bottomAxisTitle, '');
      assert.equal(leftAxisTitle, '');
    });

    it('renders axis labels if they are specified in the vif', () => {
      const topAxisTitle = getVizChildElement('.socrata-visualization-top-axis-title').innerHTML;
      const rightAxisTitle = getVizChildElement('.socrata-visualization-right-axis-title').innerHTML;
      const bottomAxisTitle = getVizChildElement('.socrata-visualization-bottom-axis-title').innerHTML;
      const leftAxisTitle = getVizChildElement('.socrata-visualization-left-axis-title').innerHTML;
      const copiedVif = _.cloneDeep(viz.getVif());
      const newVif = _.merge({}, copiedVif, {
        configuration: {
          axisLabels: {
            top: 'Top Title',
            right: 'Right Title',
            bottom: 'Bottom Title',
            left: 'Left Title'
          }
        }
      });
      viz.updateVif(newVif);

      assert.isTrue(getViz().hasClass('socrata-visualization-top-axis-title'));
      assert.isTrue(getViz().hasClass('socrata-visualization-right-axis-title'));
      assert.isTrue(getViz().hasClass('socrata-visualization-bottom-axis-title'));
      assert.isTrue(getViz().hasClass('socrata-visualization-left-axis-title'));
      assert.equal(topAxisTitle, 'Top Title');
      assert.equal(rightAxisTitle, 'Right Title');
      assert.equal(bottomAxisTitle, 'Bottom Title');
      assert.equal(leftAxisTitle, 'Left Title');
    });
  });

  describe('#renderError', () => {
    it('should show a general error message with submessages', () => {
      const viz = new SvgVisualization($element, mockVif);
      const customErrors = ['One Error.', 'Two Error.', 'Red Error.', 'Blue Error.'];
      viz.renderError(customErrors);
      const errorMessage = $element.find('.socrata-visualization-error-message');
      const expectedMessage = I18n.translate('visualizations.common.validation.errors.multiple_errors');
      const submessages = errorMessage.find('li');

      assert.include(errorMessage.text(), expectedMessage);
      assert.equal(submessages.length, 4);
      _.each(submessages, (message, i) => {
        assert.equal(message.innerHTML, customErrors[i]);
      });
    });
  });

  describe('#clearError', () => {
    it('should clear a rendered error message', () => {
      const viz = new SvgVisualization($element, mockVif);
      viz.renderError(['One Error.', 'Two Error.', 'Red Error.', 'Blue Error.']);
      viz.clearError();
      const errorMessage = $element.find('.socrata-visualization-error-message').text();
      assert.equal(errorMessage, '');
    });
  });

  describe('#showBusyIndicator', () => {
    it('should add busy indicator class to visualization container', () => {
      const viz = new SvgVisualization($element, mockVif);
      assert.isNotTrue(getViz().hasClass('socrata-visualization-busy'));
      viz.showBusyIndicator();
      assert.isTrue(getViz().hasClass('socrata-visualization-busy'));
    });
  });

  describe('#hideBusyIndicator', () => {
    it('should add busy class to socrata-visualizaton div', () => {
      const viz = new SvgVisualization($element, mockVif);
      viz.showBusyIndicator();
      viz.hideBusyIndicator();
      assert.isNotTrue(getViz().hasClass('socrata-visualization-busy'));
    });
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

        _.defer(() => {
          validateLink('https://vertex-stories.test-socrata.com/d/nbe4-four')
          done();
        });
      });

      it('adds a query string parameter when embedded', (done) => {
        $element.addClass('socrata-visualization-embed');
        const viz = new SvgVisualization($element, mockVif);
        viz.showViewSourceDataLink();

        _.defer(() => {
          validateLink('https://vertex-stories.test-socrata.com/d/nbe4-four?referrer=embed');
          done();
        });
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

        _.defer(() => {
          validateLink('https://vertex-stories.test-socrata.com/d/k6cs-ww27');
          done();
        });
      });

      it('adds a query string parameter when embedded', (done) => {
        $element.addClass('socrata-visualization-embed');

        const viz = new SvgVisualization($element, mockVif);
        viz.showViewSourceDataLink();

        _.defer(() => {
          validateLink('https://vertex-stories.test-socrata.com/d/k6cs-ww27?referrer=embed');
          done();
        });
      });
    });
  });

  describe('#hideViewSourceDataLink', () => {
    beforeEach(() => {
      SvgVisualization.__set__({
        MetadataProvider: function() {
          this.getDatasetMigrationMetadata = () => Promise.reject();
        }
      });
    });

    it('hides a source data link', (done) => {
      const viz = new SvgVisualization($element, mockVif);
      viz.showViewSourceDataLink();

      _.defer(() => {
        assert.isTrue(getViz().hasClass('socrata-visualization-view-source-data'));
        viz.hideViewSourceDataLink();
        assert.isNotTrue(getViz().hasClass('socrata-visualization-view-source-data'));
        done();
      });
    });
  });

  describe('#showPanningNotice', () => {
    it('should add panning-notice class to socrata-visualizaton div', () => {
      const viz = new SvgVisualization($element, mockVif);

      assert.isNotTrue(getViz().hasClass('socrata-visualization-panning-notice'));
      viz.showPanningNotice();
      assert.isTrue(getViz().hasClass('socrata-visualization-panning-notice'));
    });
  });

  describe('#hidePanningNotice', () => {
    it('should remove panning-notice class from socrata-visualizaton div', () => {
      const viz = new SvgVisualization($element, mockVif);
      viz.showPanningNotice();

      assert.isTrue(getViz().hasClass('socrata-visualization-panning-notice'));
      viz.hidePanningNotice();
      assert.isNotTrue(getViz().hasClass('socrata-visualization-panning-notice'));
    });
  });

  describe('#showInfo', () => {
    it('should add show-info class to socrata-visualizaton div', () => {
      const viz = new SvgVisualization($element, mockVif);
      viz.hideViewSourceDataLink();
      viz.hidePanningNotice();
      viz.hideInfo();

      assert.isNotTrue(getViz().hasClass('socrata-visualization-info'));
      viz.showInfo();
      assert.isTrue(getViz().hasClass('socrata-visualization-info'));
    });
  });

  describe('#hideInfo', () => {
    it('should remove show-info class from socrata-visualizaton div', () => {
      const viz = new SvgVisualization($element, mockVif);
      viz.hideViewSourceDataLink();
      viz.hidePanningNotice();
      viz.hideInfo();

      assert.isNotTrue(getViz().hasClass('socrata-visualization-info'));
    });
  });

  describe('#isMultiSeries', () => {
    it('returns true when a vif contains a grouping dimension', () => {
      const viz = new SvgVisualization($element, mockVif);
      assert.isNotTrue(viz.isMultiSeries());

      const copiedVif = _.cloneDeep(viz.getVif());
      const addedGrouping = {
        grouping: { columnName: 'blood_alcohol_level' }
      };
      _.merge(copiedVif.series[0].dataSource.dimension, addedGrouping);
      viz.updateVif(copiedVif);
      assert.isTrue(viz.isMultiSeries());
    });

    it('returns true when a vif contains multiple series objects', () => {
      const viz = new SvgVisualization($element, mockMultiseriesVif);
      assert.isTrue(viz.isMultiSeries());
    });
  });

  describe('#getSeriesIndexByLabel', () => {
    it('returns the the series index for a label', () => {
      const viz = new SvgVisualization($element, mockMultiseriesVif);

      assert.equal(viz.getSeriesIndexByLabel(null), 0);
      assert.equal(viz.getSeriesIndexByLabel('A Label'), 1);
    });
  });

  describe('#getTypeVariantBySeriesIndex', () => {
    // This method is written specifically for columnChart & timelineChart
    // The series types containing a '.' are older and can't be created with AX

    it('returns the the visualization type based on the series index', () => {
      const viz = new SvgVisualization($element, mockVif);
      const copiedVif = _.cloneDeep(viz.getVif());
      copiedVif.series[1] = _.cloneDeep(copiedVif.series[0]);
      copiedVif.series[2] = _.cloneDeep(copiedVif.series[0]);
      copiedVif.series[0].type = 'columnChart';
      copiedVif.series[1].type = 'timelineChart';
      copiedVif.series[2].type = 'timeline.line';
      viz.updateVif(copiedVif);

      assert.equal(viz.getTypeVariantBySeriesIndex(0), 'column');
      assert.equal(viz.getTypeVariantBySeriesIndex(1), 'area');
      assert.equal(viz.getTypeVariantBySeriesIndex(2), 'line');
    });
  });

  describe('#getUnitOneBySeriesIndex', () => {
    it('returns the specified value for one unit by series index', () => {
      const viz = new SvgVisualization($element, mockMultiseriesVif);
      assert.equal(viz.getUnitOneBySeriesIndex(0), 'Row');
      assert.equal(viz.getUnitOneBySeriesIndex(1), 'Banana');
    });

    it('returns an empty string if the one unit is not specified', () => {
      const viz = new SvgVisualization($element, mockVif);
      const copiedVif = _.cloneDeep(viz.getVif());
      copiedVif.series[0].unit.one = null;
      viz.updateVif(copiedVif);

      assert.equal(viz.getUnitOneBySeriesIndex(0), '');
    });
  });

  describe('#getUnitOtherBySeriesIndex', () => {
    it('returns the specified value for other units by series index', () => {
      const viz = new SvgVisualization($element, mockMultiseriesVif);
      assert.equal(viz.getUnitOtherBySeriesIndex(0), 'Rows');
      assert.equal(viz.getUnitOtherBySeriesIndex(1), 'Bananas');
    });

    it('returns an empty string if the other unit is not specified', () => {
      const viz = new SvgVisualization($element, mockVif);
      const copiedVif = _.cloneDeep(viz.getVif());
      copiedVif.series[0].unit.other = null;
      viz.updateVif(copiedVif);

      assert.equal(viz.getUnitOtherBySeriesIndex(0), '');
    });
  });

  describe('#getPrimaryColorBySeriesIndex', () => {
    it('returns the primary palette color for each index of a grouped series', () => {
      const viz = new SvgVisualization($element, mockMultiseriesVif);
      const copiedVif = _.cloneDeep(viz.getVif());
      copiedVif.series[0].color.palette = 'categorical';
      const addedGrouping = {
        grouping: { columnName: 'blood_alcohol_level' }
      };
      _.merge(copiedVif.series[0].dataSource.dimension, addedGrouping);
      viz.updateVif(copiedVif);
      assert.equal(viz.getPrimaryColorBySeriesIndex(0), COLOR_PALETTES.categorical[0]);
      assert.equal(viz.getPrimaryColorBySeriesIndex(1), COLOR_PALETTES.categorical[1]);
    });

    it('returns the set primary color if a color palette is not specified', () => {
      const viz = new SvgVisualization($element, mockMultiseriesVif);
      assert.equal(viz.getPrimaryColorBySeriesIndex(0), mockMultiseriesVif.series[0].color.primary);
      assert.equal(viz.getPrimaryColorBySeriesIndex(1), mockMultiseriesVif.series[1].color.primary);
    });

    it('returns the default secondary color if a color palette is not specified', () => {
      const viz = new SvgVisualization($element, mockVif);
      const copiedVif = _.cloneDeep(viz.getVif());
      copiedVif.series[0].color = {};
      viz.updateVif(copiedVif);

      assert.equal(viz.getPrimaryColorBySeriesIndex(0), DEFAULT_PRIMARY_COLOR);
    });
  });

  describe('#getSecondaryColorBySeriesIndex', () => {
    it('returns the secondary color for each index of a series', () => {
      const viz = new SvgVisualization($element, mockMultiseriesVif);
      assert.equal(viz.getSecondaryColorBySeriesIndex(0), mockMultiseriesVif.series[0].color.secondary);
      assert.equal(viz.getSecondaryColorBySeriesIndex(1), mockMultiseriesVif.series[1].color.secondary);
    });

    it('returns the default secondary color if a color is not specified', () => {
      const viz = new SvgVisualization($element, mockVif);
      const copiedVif = _.cloneDeep(viz.getVif());
      copiedVif.series[0].color = {};
      viz.updateVif(copiedVif);

      assert.equal(viz.getSecondaryColorBySeriesIndex(0), DEFAULT_SECONDARY_COLOR);
    });
  });

  describe('#getHighlightColorBySeriesIndex', () => {
    it('returns the highlight color for each index of a series', () => {
      const viz = new SvgVisualization($element, mockMultiseriesVif);
      assert.equal(viz.getHighlightColorBySeriesIndex(0), mockMultiseriesVif.series[0].color.highlight);
      assert.equal(viz.getHighlightColorBySeriesIndex(1), mockMultiseriesVif.series[1].color.highlight);
    });

    it('returns the default highlight color if a color is not specified', () => {
      const viz = new SvgVisualization($element, mockVif);
      const copiedVif = _.cloneDeep(viz.getVif());
      copiedVif.series[0].color = {};
      viz.updateVif(copiedVif);

      assert.equal(viz.getHighlightColorBySeriesIndex(0), DEFAULT_HIGHLIGHT_COLOR);
    });
  });

  describe('#getXAxisScalingModeBySeriesIndex', () => {
    let viz;

    beforeEach(() => {
      viz = new SvgVisualization($element, mockMultiseriesVif);
    });

    it('returns set XAxisScalingMode for each index', () => {
      const copiedVif = _.cloneDeep(viz.getVif());
      copiedVif.configuration.xAxisScalingMode = 'pan';
      viz.updateVif(copiedVif);

      assert.equal(viz.getXAxisScalingModeBySeriesIndex(0), 'pan');
      assert.equal(viz.getXAxisScalingModeBySeriesIndex(1), 'pan');
    });

    it('returns `fit` for timelines and `pan` for other charts if not specified', () => {
      assert.equal(viz.getXAxisScalingModeBySeriesIndex(0), 'pan');
      assert.equal(viz.getXAxisScalingModeBySeriesIndex(1), 'fit');
    });
  });

  describe('#getColorPaletteBySeriesIndex', () => {
    it('returns the color palette for each index of a series', () => {
      const viz = new SvgVisualization($element, mockMultiseriesVif);
      const copiedVif = _.cloneDeep(viz.getVif());
      copiedVif.series[0].color.palette = 'categorical2';
      copiedVif.series[1].color.palette = 'dark';
      viz.updateVif(copiedVif);

      assert.equal(viz.getColorPaletteBySeriesIndex(0), COLOR_PALETTES.categorical2);
      assert.equal(viz.getColorPaletteBySeriesIndex(1), COLOR_PALETTES.dark);
    });

    it('returns the default palette if a palette is not specified', () => {
      const viz = new SvgVisualization($element, mockVif);
      assert.deepEqual(viz.getColorPaletteBySeriesIndex(0), COLOR_PALETTES.categorical);
    });
  });

  describe('#getYAxisScalingMode', () => {
    let viz;

    beforeEach(() => {
      viz = new SvgVisualization($element, mockMultiseriesVif);
    });

    it('returns `showZero` if yAxisScalingMode is not set', () => {
      assert.equal(viz.getYAxisScalingMode(), 'showZero');
    });

    it('returns the set yAxisScalingMode', () => {
      const copiedVif = _.cloneDeep(viz.getVif());
      copiedVif.configuration.yAxisScalingMode = 'fit';
      viz.updateVif(copiedVif);

      assert.equal(viz.getYAxisScalingMode(), 'fit');
    });
  });

  describe('#getMeasureAxisMinValue', () => {
    let viz;

    beforeEach(() => {
      viz = new SvgVisualization($element, mockVif);
    });

    it('returns the measureAxisMinValue if present', () => {
      assert.equal(viz.getMeasureAxisMinValue(), 50);
    });

    it('returns null if measureAxisMinValue is not present', () => {
      const copiedVif = _.cloneDeep(viz.getVif());
      copiedVif.configuration = {};
      viz.updateVif(copiedVif);
      assert.equal(viz.getMeasureAxisMinValue(), null);
    });

    it('throws an error if measureAxisMinValue if not non-numeric', () => {
      const copiedVif = _.cloneDeep(viz.getVif());
      copiedVif.configuration.measureAxisMinValue = 'string';
      viz.updateVif(copiedVif);

      assert.throws(
        viz.getMeasureAxisMinValue,
        I18n.translate(
          'visualizations.common.validation.errors.measure_axis_min_value_should_be_numeric'
        )
      );
    });
  });

  describe('#getMeasureAxisMaxValue', () => {
    let viz;

    beforeEach(() => {
      viz = new SvgVisualization($element, mockVif);
    });

    it('returns the measureAxisMaxValue if present', () => {
      assert.equal(viz.getMeasureAxisMaxValue(), 200);
    });

    it('returns null if measureAxisMaxValue is not present', () => {
      const copiedVif = _.cloneDeep(viz.getVif());
      copiedVif.configuration = {};
      viz.updateVif(copiedVif);
      assert.equal(viz.getMeasureAxisMaxValue(), null);
    });

    it('throws an error if measureAxisMaxValue if not non-numeric', () => {
      const copiedVif = _.cloneDeep(viz.getVif());
      copiedVif.configuration.measureAxisMaxValue = 'string';
      viz.updateVif(copiedVif);

      assert.throws(
        viz.getMeasureAxisMaxValue,
        I18n.translate(
          'visualizations.common.validation.errors.measure_axis_max_value_should_be_numeric'
        )
      );
    });
  });

  describe('#getShowDimensionLabels', () => {
    let viz;

    beforeEach(() => {
      viz = new SvgVisualization($element, mockVif);
    });

    it('returns true if showDimensionLabels is not set', () => {
      assert.isTrue(viz.getShowDimensionLabels());
    });

    it('returns the value of showDimensionLabels if present', () => {
      const copiedVif = _.cloneDeep(viz.getVif());
      copiedVif.configuration.showDimensionLabels = false;
      viz.updateVif(copiedVif);
      assert.isFalse(viz.getShowDimensionLabels());
    });
  });

  describe('#getShowValueLabels', () => {
    let viz;

    beforeEach(() => {
      viz = new SvgVisualization($element, mockVif);
    });

    it('returns true if showValueLabels is not set', () => {
      assert.isTrue(viz.getShowValueLabels());
    });

    it('returns the value of showValueLabels if present', () => {
      const copiedVif = _.cloneDeep(viz.getVif());
      copiedVif.configuration.showValueLabels = false;
      viz.updateVif(copiedVif);
      assert.isFalse(viz.getShowValueLabels());
    });
  });

  describe('#getShowValueLabelsAsPercent', () => {
    let viz;

    beforeEach(() => {
      viz = new SvgVisualization($element, mockVif);
    });

    it('returns false if showValueLabelsAsPercent is not set', () => {
      assert.isFalse(viz.getShowValueLabelsAsPercent());
    });

    it('returns the value of showValueLabelsAsPercent if present', () => {
      const copiedVif = _.cloneDeep(viz.getVif());
      copiedVif.configuration.showValueLabelsAsPercent = true;
      viz.updateVif(copiedVif);
      assert.isTrue(viz.getShowValueLabelsAsPercent());
    });
  });

  describe('#emitEvent', () => {
    it('emits an event on the element', function(done) {
      $element.on('TEST_EVENT', function(event) {
        const payload = event.originalEvent.detail;
        const option = event.originalEvent.bubbles;
        assert.equal(payload.content, null);
        assert.isTrue(option);
        done();
      });

      const viz = new SvgVisualization($element, mockVif);
      viz.emitEvent('TEST_EVENT', {content: null});
    });
  });
});
