import _ from 'lodash';
import $ from 'jquery';
import d3 from 'd3';
import I18n from 'common/i18n';
import allLocales from 'common/i18n/config/locales';
import VifHelpers from 'common/visualizations/helpers/VifHelpers';
import SvgVisualization, {
  __RewireAPI__ as SvgVisualizationAPI
} from 'common/visualizations/views/SvgVisualization';
import {
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  DEFAULT_HIGHLIGHT_COLOR,
  COLOR_PALETTES
} from 'common/visualizations/views/SvgStyleConstants';
import mockVif from '../mockVif';
import mockMultiseriesVif from '../mockMultiseriesVif';
const mockVifDomain = mockVif.series[0].dataSource.domain;
const mockVifDatasetUid = mockVif.series[0].dataSource.datasetUid;

describe('SvgVisualization', () => {
  let $element;

  // Returns the outermost node of the rendered visualization.
  const getViz = () => $element.children().first();
  const getVizElement = () => $element.find('.socrata-visualization')[0];
  const getVizChildElement = (childClass) => $element.find(`.socrata-visualization ${childClass}`)[0];

  beforeEach(function() {
    I18n.translations.en = allLocales.en;
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
      '.socrata-visualization-description'
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
          },
          // If you change to true, make sure to mock out the resultant MetadataProvider request.
          viewSourceDataLink: false
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

  describe('#updateColumns', () => {
    let viz;
    let columnsMock;
    let renderFilterBarStub;

    beforeEach(() => {
      columnsMock = [1];
      viz = new SvgVisualization($element, mockVif);
      renderFilterBarStub = sinon.stub(viz, 'renderFilterBar');
    });

    it('replaces previous columns with new value', () => {
      viz.updateColumns(columnsMock);
      assert.deepEqual(viz.getColumns(), columnsMock);
    });

    it('re-renders the filter bar', () => {
      viz.updateColumns(columnsMock);
      sinon.assert.calledOnce(renderFilterBarStub);
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

  describe('#renderFilterBar', () => {
    let viz;
    let columnsMock = [
      {
        name: 'Blood Alcohol Level',
        fieldName: 'blood_alcohol_level',
        dataTypeName: 'number',
        rangeMin: 1,
        rangeMax: 10
      }
    ];

    const getVisualization = ($el) => $el.find('.socrata-visualization');
    const getFilterBarContainer = ($el) => $el.find('.socrata-visualization-filter-bar-container');

    beforeEach(() => {
      const vif = _.cloneDeep(mockVif);

      _.set(vif, 'series[0].dataSource.filters[0].isHidden', false);

      viz = new SvgVisualization($element, vif, { displayFilterBar: true });
      viz.updateColumns(columnsMock);
    });

    it('renders nothing when there are no columns', () => {
      viz.updateColumns(null);

      assert.isFalse(getVisualization($element).hasClass('socrata-visualization-filter-bar'));
      assert.lengthOf(getFilterBarContainer($element).children(), 0);
    });

    it('renders nothing when displayFilterBar is false', () => {
      viz.updateOptions({ displayFilterBar: false });
      viz.updateColumns(columnsMock);

      assert.isFalse(getVisualization($element).hasClass('socrata-visualization-filter-bar'));
      assert.lengthOf(getFilterBarContainer($element).children(), 0);
    });

    it('renders nothing when there are no visible filters', () => {
      const vif = _.cloneDeep(mockVif);
      viz.updateVif(vif);

      assert.isFalse(getVisualization($element).hasClass('socrata-visualization-filter-bar'));
      assert.lengthOf(getFilterBarContainer($element).children(), 0);
    });

    it('renders', () => {
      assert.isAbove(getFilterBarContainer($element).children().length, 0);
    });

    it('adds socrata-visualization-filter-bar to container', () => {
      assert.isTrue(getVisualization($element).hasClass('socrata-visualization-filter-bar'));
    });
  });

  describe('#renderAxisLabels', () => {
    let viz;
    let $viz;
    let svgContainer;
    let copiedVif;
    let viewport = { x: 0, y: 0, width: 100, height: 100 };

    beforeEach(() => {
      viz = new SvgVisualization($element, mockVif);
      copiedVif = _.cloneDeep(viz.getVif());
      svgContainer = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
      $viz = getViz();
      $viz.append(svgContainer.node());
    });

    it('only renders specified axis labels', () => {
      const newVif = _.merge({}, copiedVif, {
        configuration: {
          axisLabels: {
            top: 'Top Title',
            left: 'Left Title'
          }
        }
      });

      const $viz = getViz();

      $viz.append(svgContainer.node());
      viz.updateVif(newVif);
      viz.renderAxisLabels(svgContainer, viewport);

      const $rightAxis = $viz.find('.socrata-visualization-right-axis-title');
      const $bottomAxis = $viz.find('.socrata-visualization-bottom-axis-title');

      const topAxisTitle = $viz.find('.socrata-visualization-top-axis-title').text();
      const leftAxisTitle = $viz.find('.socrata-visualization-left-axis-title').text();

      assert.lengthOf($rightAxis, 0);
      assert.lengthOf($bottomAxis, 0);
      assert.equal(topAxisTitle, 'Top Title');
      assert.equal(leftAxisTitle, 'Left Title');
    });

    it('renders axis labels if they are specified in the vif', () => {
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
      viz.renderAxisLabels(svgContainer, viewport);

      const topAxisTitle = $viz.find('.socrata-visualization-top-axis-title').text();
      const rightAxisTitle = $viz.find('.socrata-visualization-right-axis-title').text();
      const bottomAxisTitle = $viz.find('.socrata-visualization-bottom-axis-title').text();
      const leftAxisTitle = $viz.find('.socrata-visualization-left-axis-title').text();

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
      const expectedMessage = I18n.t('shared.visualizations.charts.common.validation.errors.multiple_errors');
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
    function validateLink(expectedURL) {
      const rendered = getViz();
      assert.isTrue(rendered.hasClass('socrata-visualization-view-source-data'));
      assert.equal(
        rendered.find('.socrata-visualization-view-source-data a').attr('href'),
        expectedURL
      );
    }

    afterEach(() => {
      SvgVisualizationAPI.__ResetDependency__('MetadataProvider');
    });

    describe('when migration data exists', () => {
      beforeEach(() => {
        SvgVisualizationAPI.__Rewire__('MetadataProvider', function() {
          this.getDatasetMigrationMetadata = () => Promise.resolve({ nbe_id: 'nbe4-four' });
        });
      });

      it('renders a source data link', (done) => {
        const vif = _.cloneDeep(mockVif);
        vif.configuration.viewSourceDataLink = true;

        const viz = new SvgVisualization($element, mockVif);
        viz.showViewSourceDataLink();

        _.defer(() => {
          validateLink(`https://${mockVifDomain}/d/nbe4-four`)
          done();
        });
      });

      it('adds a query string parameter when embedded', (done) => {
        $element.addClass('socrata-visualization-embed');
        const viz = new SvgVisualization($element, mockVif);
        viz.showViewSourceDataLink();

        _.defer(() => {
          validateLink(`https://${mockVifDomain}/d/nbe4-four?referrer=embed`);
          done();
        });
      });
    });

    describe('when migration data does not exist', () => {
      beforeEach(() => {
        SvgVisualizationAPI.__Rewire__('MetadataProvider', function() {
          this.getDatasetMigrationMetadata = () => Promise.reject();
        });
      });

      it('renders a source data link', (done) => {
        const viz = new SvgVisualization($element, mockVif);
        viz.showViewSourceDataLink();

        _.defer(() => {
          validateLink(`https://${mockVifDomain}/d/${mockVifDatasetUid}`);
          done();
        });
      });

      it('adds a query string parameter when embedded', (done) => {
        $element.addClass('socrata-visualization-embed');

        const viz = new SvgVisualization($element, mockVif);
        viz.showViewSourceDataLink();

        _.defer(() => {
          validateLink(`https://${mockVifDomain}/d/${mockVifDatasetUid}?referrer=embed`);
          done();
        });
      });
    });
  });

  describe('#hideViewSourceDataLink', () => {
    beforeEach(() => {
      SvgVisualizationAPI.__Rewire__('MetadataProvider', function() {
        this.getDatasetMigrationMetadata = () => Promise.reject();
      });
    });

    afterEach(() => {
      SvgVisualizationAPI.__ResetDependency__('MetadataProvider');
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

  describe('#isGroupingOrMultiSeries', () => {
    it('returns true when a vif contains a grouping dimension', () => {
      const viz = new SvgVisualization($element, mockVif);
      assert.isNotTrue(viz.isGroupingOrMultiSeries());

      const copiedVif = _.cloneDeep(viz.getVif());
      const addedGrouping = {
        grouping: { columnName: 'blood_alcohol_level' }
      };
      _.merge(copiedVif.series[0].dataSource.dimension, addedGrouping);
      viz.updateVif(copiedVif);
      assert.isTrue(viz.isGroupingOrMultiSeries());
    });

    it('returns true when a vif contains multiple series objects', () => {
      const viz = new SvgVisualization($element, mockMultiseriesVif);
      assert.isTrue(viz.isGroupingOrMultiSeries());
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

  describe('#getMeasureAggregationBySeriesIndex', () => {
    it('returns the aggregation function at the series index', () => {
      const viz = new SvgVisualization($element, mockMultiseriesVif);
      assert.equal(viz.getMeasureAggregationBySeriesIndex(0), 'count');
      assert.equal(viz.getMeasureAggregationBySeriesIndex(1), 'sum');
    });

    it('downcases the aggregation function', () => {
      const viz = new SvgVisualization($element, mockVif);
      const copiedVif = _.cloneDeep(viz.getVif());
      copiedVif.series[0].dataSource.measure.aggregationFunction = 'COUNT';
      viz.updateVif(copiedVif);

      assert.equal(viz.getMeasureAggregationBySeriesIndex(0), 'count');
    });
  });

  describe('#getUnitOneBySeriesIndex', () => {
    it('returns the specified value for one unit by series index', () => {
      const viz = new SvgVisualization($element, mockMultiseriesVif);
      assert.equal(viz.getUnitOneBySeriesIndex(0), 'Row');
      assert.equal(viz.getUnitOneBySeriesIndex(1), 'Banana');
    });

    it('returns the default unit if the one unit is not specified', () => {
      const viz = new SvgVisualization($element, mockVif);
      const copiedVif = _.cloneDeep(viz.getVif());
      copiedVif.series[0].unit.one = null;
      viz.updateVif(copiedVif);

      assert.equal(viz.getUnitOneBySeriesIndex(0), 'Row');
    });

    it('returns the default unit if the one unit is an empty string', () => {
      const viz = new SvgVisualization($element, mockVif);
      const copiedVif = _.cloneDeep(viz.getVif());
      copiedVif.series[0].unit.one = '';
      viz.updateVif(copiedVif);

      assert.equal(viz.getUnitOneBySeriesIndex(0), 'Row');
    });

    it('returns the sum aggregation unit if there is an aggregation function and no specified one unit', () => {
      const viz = new SvgVisualization($element, mockVif);
      const copiedVif = _.cloneDeep(viz.getVif());
      copiedVif.series[0].unit.one = null;
      copiedVif.series[0].dataSource.measure.aggregationFunction = 'sum';
      viz.updateVif(copiedVif);

      assert.equal(viz.getUnitOneBySeriesIndex(0), I18n.t('shared.visualizations.charts.common.sum_aggregation_unit'));
    });
  });

  describe('#getUnitOtherBySeriesIndex', () => {
    it('returns the specified value for other units by series index', () => {
      const viz = new SvgVisualization($element, mockMultiseriesVif);
      assert.equal(viz.getUnitOtherBySeriesIndex(0), 'Rows');
      assert.equal(viz.getUnitOtherBySeriesIndex(1), 'Bananas');
    });

    it('returns the default unit if the other unit is not specified', () => {
      const viz = new SvgVisualization($element, mockVif);
      const copiedVif = _.cloneDeep(viz.getVif());
      copiedVif.series[0].unit.other = null;
      viz.updateVif(copiedVif);

      assert.equal(viz.getUnitOtherBySeriesIndex(0), I18n.t('shared.visualizations.charts.common.unit.other'));
    });

    it('returns the default unit if the other unit is an empty string', () => {
      const viz = new SvgVisualization($element, mockVif);
      const copiedVif = _.cloneDeep(viz.getVif());
      copiedVif.series[0].unit.other = '';
      viz.updateVif(copiedVif);

      assert.equal(viz.getUnitOtherBySeriesIndex(0), I18n.t('shared.visualizations.charts.common.unit.other'));
    });

    it('returns the sum aggregation unit if there is an aggregation function and no specified other unit', () => {
      const viz = new SvgVisualization($element, mockVif);
      const copiedVif = _.cloneDeep(viz.getVif());
      copiedVif.series[0].unit.other = null;
      copiedVif.series[0].dataSource.measure.aggregationFunction = 'sum';
      viz.updateVif(copiedVif);

      assert.equal(viz.getUnitOtherBySeriesIndex(0), I18n.t('shared.visualizations.charts.common.sum_aggregation_unit'));
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

  describe('#getColor', () => {
    let viz;
    let customPalette;
    const dimensionIndex = 0;
    const measureIndex = 0;
    const measureLabels = [];

    beforeEach(() => {
      viz = new SvgVisualization($element, mockVif);
    });

    it('throws if arguments are invalid', () => {
      assert.throws(() => {
        viz.getColor();
      });

      // no dimensionIndex
      assert.throws(() => {
        viz.getColor(null, 0, []);
      });

      // no measureIndex
      assert.throws(() => {
        viz.getColor(0, null, []);
      });

      // no measureLabels
      assert.throws(() => {
        viz.getColor(0, 0);
      });
    });

    it('defaults to returning a single primary color', () => {
      const copiedVif = _.cloneDeep(viz.getVif());
      viz.updateVif(copiedVif);

      assert.equal(viz.getColor(dimensionIndex, measureIndex, measureLabels), DEFAULT_PRIMARY_COLOR);
    });

    it('chooses a color from a palette if a palette is present on the Vif', () => {
      const copiedVif = _.cloneDeep(viz.getVif());

      copiedVif.series[0].color.palette = 'categorial';
      viz.updateVif(copiedVif);

      const color = viz.getColor(dimensionIndex, measureIndex, measureLabels);
      assert.equal(color, COLOR_PALETTES.categorical[0])
    });

    it('uses a custom color palette if defined', () => {
      const copiedVif = _.cloneDeep(viz.getVif());
      const addedGrouping = {
        grouping: { columnName: 'id' }
      };
      customPalette = {
        'id': {
          '10998': { 'color': '#5b9ec9', 'index': 1 },
          '10999': { 'color': '#a6cee3', 'index': 0 },
          '(Other)': { 'color': '#fe982c', 'index': 12 }
        }
      };
      _.merge(copiedVif.series[0].dataSource.dimension, addedGrouping);
      copiedVif.series[0].color.palette = 'custom';
      copiedVif.series[0].color.customPalette = customPalette;
      viz.updateVif(copiedVif);
      const color = viz.getColor(dimensionIndex, measureIndex, _.keys(customPalette.id));
      assert.equal(color, '#5b9ec9');
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

  describe('#getColorPaletteByColumnTitles', () => {
    let viz;
    let stub;
    let customPalette;

    beforeEach(() => {
      stub = sinon.stub();
      SvgVisualizationAPI.__Rewire__('CustomColorPaletteManager', {
        getDisplayedColorsFromCustomPalette: stub
      });

      viz = new SvgVisualization($element, mockVif);

      const copiedVif = _.cloneDeep(viz.getVif());
      const addedGrouping = {
        grouping: { columnName: 'id' }
      };
      customPalette = {
        'id': {
          '10988': { 'color': '#fdbb69', 'index': 11 },
          '10989': { 'color': '#f06c45', 'index': 10 },
          '10990': { 'color': '#e42022', 'index': 9 },
          '10991': { 'color': '#f16666', 'index': 8 },
          '10992': { 'color': '#dc9a88', 'index': 7 },
          '10993': { 'color': '#6f9e4c', 'index': 6 },
          '10994': { 'color': '#52af43', 'index': 5 },
          '10995': { 'color': '#98d277', 'index': 4 },
          '10996': { 'color': '#7eba98', 'index': 3 },
          '10997': { 'color': '#2d82af', 'index': 2 },
          '10998': { 'color': '#5b9ec9', 'index': 1 },
          '10999': { 'color': '#a6cee3', 'index': 0 },
          '(Other)': { 'color': '#fe982c', 'index': 12 }
        }
      };
      _.merge(copiedVif.series[0].dataSource.dimension, addedGrouping);
      copiedVif.series[0].color.palette = 'custom';
      copiedVif.series[0].color.customPalette = customPalette;
      viz.updateVif(copiedVif);
    });

    afterEach(() => {
      SvgVisualizationAPI.__ResetDependency__('CustomColorPaletteManager');
    });

    it('calls getColorPaletteByColumnTitles with the correct arguments', () => {
      const columnNames = [ '10988', '10989', '10990', '10991', '10992', '10993', '10994', '10995', '10996', '10997', '10998', '10999', '(Other)' ];
      const columnColors = ['#fdbb69', '#f06c45', '#e42022', '#f16666', '#dc9a88', '#6f9e4c', '#52af43', '#98d277', '#7eba98', '#2d82af', '#5b9ec9', '#a6cee3', '#fe982c'];
      viz.getColorPaletteByColumnTitles(columnNames)

      sinon.assert.calledWith(stub, columnNames, customPalette.id);
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
        I18n.t(
          'shared.visualizations.charts.common.validation.errors.measure_axis_min_value_should_be_numeric'
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
        I18n.t(
          'shared.visualizations.charts.common.validation.errors.measure_axis_max_value_should_be_numeric'
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

  describe('#isEmbedded', () => {
    let viz;

    beforeEach(() => {
      viz = new SvgVisualization($element, mockVif);
    });

    it('returns true when the proper class is on the container', () => {
      $element.addClass('socrata-visualization-embed');
      assert.isTrue(viz.isEmbedded());
    });

    it('returns false when the proper class is not on the container', () => {
      assert.isFalse(viz.isEmbedded());
    });
  });

  describe('#shouldDisplayFilterBar', () => {
    let viz;

    beforeEach(() => {
      viz = new SvgVisualization($element, mockVif);
    });

    it('returns false when the option is set to false', () => {
      viz.updateOptions({
        displayFilterBar: false
      });

      assert.isFalse(viz.shouldDisplayFilterBar());
    });

    it('returns true when the option is set to true', () => {
      viz.updateOptions({
        displayFilterBar: true
      });

      assert.isTrue(viz.shouldDisplayFilterBar());
    });

    it('returns false when the option is not set', () => {
      assert.isFalse(viz.shouldDisplayFilterBar());
    });
  });

  describe('#getOneHundredPercentStackedPositions', () => {
    let viz;

    beforeEach(() => {
      viz = new SvgVisualization($element, mockVif);
    });

    const data = [
      ["Ice Cream",4000,1000,1000,4000],
      ["Cookies",4000,1000,-1000,4000],
      ["Brownies",-4000,-1000,1000,4000]
    ];

    const expectedPositions = [
      [
        {"start":0,"end":0.4,"percent":40},
        {"start":0.4,"end":0.5,"percent":10},
        {"start":0.5,"end":0.6,"percent":10},
        {"start":0.6,"end":1,"percent":40}
      ],
      [
        {"start":0,"end":0.4,"percent":40},
        {"start":0.4,"end":0.5,"percent":10},
        {"start":-0.1,"end":0,"percent":-10},
        {"start":0.5,"end":0.9,"percent":40}
      ],
      [
        {"start":-0.4,"end":0,"percent":-40},
        {"start":-0.5,"end":-0.4,"percent":-10},
        {"start":0,"end":0.1,"percent":10},
        {"start":0.1,"end":0.5,"percent":40}
      ]
    ];

    it('combines a vif with a default vif', () => {
      
      let positions = viz.getOneHundredPercentStackedPositions(data);
      assert.deepEqual(positions, expectedPositions);
    });
  });
});
