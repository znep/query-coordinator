import _ from 'lodash';
import $ from 'jquery';

import renderComponent from '../renderComponent';
import { Visualization } from 'src/authoringWorkflow/components/Visualization';
import vifs from 'src/authoringWorkflow/vifs';

function defaultProps() {
  var vifsCloned = vifs();
  return {
    vifAuthoring: {
      vifs: vifsCloned,
      authoring: {
        selectedVisualizationType: vifsCloned.columnChart.series[0].type
      }
    },
    vif: vifsCloned.columnChart
  }
};

// Replace chart implementations
// with Sinon stubs.
function stubCharts() {
  const stubbedCharts = [
    'socrataSvgColumnChart',
    'socrataSvgTimelineChart',
    'socrataSvgHistogram',
    'socrataSvgFeatureMap',
    'socrataChoroplethMap'
  ];
  var originalChartImplementations;

  beforeEach(function() {
    originalChartImplementations = _.pick($.fn, stubbedCharts);
    stubbedCharts.forEach((fnName) => $.fn[fnName] = sinon.stub());
  });

  afterEach(function() {
    _.assign($.fn, originalChartImplementations);
  });
}

function rendersChartType(props, jqueryFunctionName) {
  it(`calls $.fn.${jqueryFunctionName}`, function() {
    renderComponent(Visualization, props);
    sinon.assert.calledOnce($.fn[jqueryFunctionName]);
  });
}

describe('Visualization', function() {
  stubCharts();

  afterEach(function() {
    $('#socrata-row-inspector').remove();
  });

  it('with an invalid vif renders an empty <div>', function() {
    var element = renderComponent(Visualization, _.set(defaultProps(), 'vif', {}));

    expect(element.querySelector('.visualization-preview')).to.be.empty;
    expect(element).to.have.class('visualization-preview-container');
  });

  describe('with a valid vif', function() {
    describe('when rendering a columnChart', function() {
      var props = defaultProps();

      _.set(props, 'vif.series[0].type','columnChart');
      _.set(props, 'vif.series[0].dataSource.dimension.columnName','example_dimension');
      _.set(props, 'vif.series[0].dataSource.measure.columnName','example_measure');
      _.set(props, 'vif.series[0].dataSource.datasetUid','exam-ples');
      _.set(props, 'vif.series[0].dataSource.domain','example.com');

      rendersChartType(props, 'socrataSvgColumnChart');
    });

    describe('when rendering a histogram', function() {
      var props = defaultProps();
      _.set(props, 'vif.series[0].type', 'histogram');

      _.set(props, 'vif.series[0].dataSource.dimension.columnName', 'example_dimension');
      _.set(props, 'vif.series[0].dataSource.measure.columnName', 'example_measure');
      _.set(props, 'vif.series[0].dataSource.datasetUid', 'exam-ples');
      _.set(props, 'vif.series[0].dataSource.domain', 'example.com');

      rendersChartType(props, 'socrataSvgHistogram');
    });

    describe('when rendering a timelineChart', function() {
      var props = defaultProps();
      _.set(props, 'vif.series[0].type', 'timelineChart');

      _.set(props, 'vif.series[0].dataSource.dimension.columnName', 'example_dimension');
      _.set(props, 'vif.series[0].dataSource.measure.columnName', 'example_measure');
      _.set(props, 'vif.series[0].dataSource.datasetUid', 'exam-ples');
      _.set(props, 'vif.series[0].dataSource.domain', 'example.com');

      rendersChartType(props, 'socrataSvgTimelineChart');
    });

    describe('when rendering a featureMap', function() {
      var props = defaultProps();
      _.set(props, 'vif.series[0].type', 'featureMap');

      _.set(props, 'vif.series[0].dataSource.dimension.columnName', 'example_dimension');
      _.set(props, 'vif.series[0].dataSource.datasetUid', 'exam-ples');
      _.set(props, 'vif.series[0].dataSource.domain', 'example.com');

      rendersChartType(props, 'socrataSvgFeatureMap');
    });

    describe('when renderings a choroplethMap', function() {
      var props = defaultProps();

      _.set(props, 'vif.series[0].type', 'choroplethMap');
      _.set(props, 'vif.configuration.computedColumnName', '@computed_column');
      _.set(props, 'vif.configuration.shapefile.uid', 'four-four');
      _.set(props, 'vif.series[0].dataSource.dimension.columnName', 'example_dimension');
      _.set(props, 'vif.series[0].dataSource.measure.aggregationFunction', 'sum');
      _.set(props, 'vif.series[0].dataSource.datasetUid', 'exam-ples');
      _.set(props, 'vif.series[0].dataSource.domain', 'example.com');

      rendersChartType(props, 'socrataChoroplethMap');
    });
  });
});
