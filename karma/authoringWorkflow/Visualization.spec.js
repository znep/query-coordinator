import _ from 'lodash';
import $ from 'jquery';

import renderComponent from './renderComponent';
import { Visualization } from 'src/authoringWorkflow/Visualization';
import vifs from 'src/authoringWorkflow/vifs';

function defaultProps() {
  var vifsCloned = vifs();
  return {
    datasetMetadata: {
      id: 'asdf-qwer'
    },
    vifAuthoring: {
      vifs: vifsCloned,
      selectedVisualizationType: vifsCloned.columnChart.series[0].type
    },
    vif: vifsCloned.columnChart
  }
};

function rendersChartType(props, jqueryFunctionName) {
  var type = _.get(props.vif, 'series[0].type');
  it(`calls $.fn.${type}`, function() {
    var spy = sinon.stub($.fn, jqueryFunctionName);
    var element = renderComponent(Visualization, props);

    sinon.assert.calledOnce(spy);
  });
}

describe('Visualization', function() {
  var cachedSvgColumnChart;
  var cachedSvgTimelineChart;
  var cachedFeatureMap;
  var cachedChoroplethMap;

  beforeEach(function() {
    cachedSvgColumnChart = $.fn.socrataSvgColumnChart;
    $.fn.socrataSvgColumnChart = _.noop;

    cachedSvgTimelineChart = $.fn.socrataSvgTimelineChart;
    $.fn.socrataSvgTimelineChart = _.noop;

    cachedFeatureMap = $.fn.socrataFeatureMap;
    $.fn.socrataFeatureMap = _.noop;

    cachedChoroplethMap = $.fn.socrataChoroplethMap;
    $.fn.socrataChoroplethMap = _.noop;
  });

  afterEach(function() {
    $.fn.socrataSvgColumnChart = cachedSvgColumnChart;
    $.fn.socrataSvgTimelineChart = cachedSvgTimelineChart;
    $.fn.socrataFeatureMap = cachedFeatureMap;
    $.fn.socrataChoroplethMap = cachedChoroplethMap;
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

      rendersChartType(props, 'socrataFeatureMap');
    });

    describe('when renderings a choroplethMap', function() {
      var props = defaultProps();

      _.set(props, 'vif.series[0].type', 'choroplethMap');
      _.set(props, 'vif.configuration.computedColumnName', '@computed_column');
      _.set(props, 'vif.configuration.shapefile.uid', 'four-four');
      _.set(props, 'vif.series[0].dataSource.dimension.columnName', 'example_dimension');
      _.set(props, 'vif.series[0].dataSource.datasetUid', 'exam-ples');
      _.set(props, 'vif.series[0].dataSource.domain', 'example.com');

      rendersChartType(props, 'socrataChoroplethMap');
    });
  });
});
