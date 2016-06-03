import $ from 'jquery';

import 'src/SvgColumnChart';
import 'src/SvgTimelineChart';

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
      _.set(props, 'vif.series[0].type','timelineChart');
      rendersChartType(props, 'socrataSvgTimelineChart');
    });
  });
});
