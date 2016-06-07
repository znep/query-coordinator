import React from 'react';
import TestUtils from 'react-addons-test-utils';

import renderComponent from '../renderComponent';
import { DataPane } from 'src/authoringWorkflow/panes/DataPane';
import defaultDatasetMetadata from 'src/authoringWorkflow/defaultDatasetMetadata';
import vifs from 'src/authoringWorkflow/vifs';

function defaultProps() {
  return {
    vif: vifs().columnChart,
    vifAuthoring: {
      vifs: vifs(),
      selectedVisualizationType: vifs().columnChart.series[0].type
    },
    datasetMetadata: _.merge({}, defaultDatasetMetadata, {
      data: {},
      phidippidiesMetadata: {columns: []}
    }),
    onChangeDatasetUid: sinon.stub(),
    onChangeDimension: sinon.stub(),
    onChangeMeasure: sinon.stub(),
    onChangeMeasureAggregation: sinon.stub(),
    onChangeChartType: sinon.stub(),
    onChangeRegion: sinon.stub()
  };
}

describe('DataPane', function() {
  var component;

  beforeEach(function() {
    component = renderComponent(DataPane, defaultProps());
  });

  describe('rendering', function() {
    describe('without data', function() {
      beforeEach(function() {
        var props = defaultProps();
        props.datasetMetadata.data = null;
        component = renderComponent(DataPane, props);
      });

      it('does not render dropdowns', function() {
        expect(component.querySelectorAll('select').length).to.equal(0);
      });
    });

    describe('with data', function() {
      beforeEach(function() {
        var props = defaultProps();
        props.datasetMetadata.data = {};

        component = renderComponent(DataPane, props);
      });

      it('renders four dropdowns', function() {
        expect(component.querySelectorAll('select').length).to.equal(4);

        expect(component.querySelector('[name="dimension-selection"]')).to.exist
        expect(component.querySelector('[name="measure-selection"]')).to.exist
        expect(component.querySelector('[name="measure-aggregation-selection"]')).to.exist
        expect(component.querySelector('[name="chart-type-selection"]')).to.exist
      });
    });
  });

  describe('events', function() {
    var props;
    var component;
    var emitsDropdownEvent = function(selector, eventName) {
      it(`should emit an ${eventName} event.`, function() {
        var dropdown = component.querySelector(selector)
        TestUtils.Simulate.change(dropdown);
        sinon.assert.calledOnce(props[eventName]);
      });
    };

    beforeEach(function() {
      props = defaultProps();
      props.datasetMetadata.data = {};

      component = renderComponent(DataPane, props);
    });

    describe('when changing the dimension dropdown', function() {
      emitsDropdownEvent('[name="dimension-selection"]', 'onChangeDimension');
    });

    describe('when changing the measure dropdown', function() {
      emitsDropdownEvent('[name="measure-selection"]', 'onChangeMeasure');
    });

    describe('when changing the measure aggregation dropdown', function() {
      emitsDropdownEvent('[name="measure-aggregation-selection"]', 'onChangeMeasureAggregation');
    });

    describe('when changing the chart type dropdown', function() {
      emitsDropdownEvent('[name="chart-type-selection"]', 'onChangeChartType');
    });

    describe('when rendering a Choropleth map', function() {
      beforeEach(function() {
        props = defaultProps();
        props.datasetMetadata.data = {};
        props.vifAuthoring.selectedVisualizationType = 'choroplethMap';

        component = renderComponent(DataPane, props);
      });

      describe('when changing the region dropdown', function() {
        emitsDropdownEvent('[name="region-selection"]', 'onChangeRegion');
      });
    });
  });
});
