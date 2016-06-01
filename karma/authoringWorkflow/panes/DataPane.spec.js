import React from 'react';
import TestUtils from 'react-addons-test-utils';

import renderComponent from '../renderComponent';
import { DataPane } from 'src/authoringWorkflow/panes/DataPane';
import defaultVif from 'src/authoringWorkflow/defaultVif';
import defaultDatasetMetadata from 'src/authoringWorkflow/defaultDatasetMetadata';

function defaultProps() {
  return {
    vif: defaultVif,
    datasetMetadata: defaultDatasetMetadata,
    onChangeDatasetUid: sinon.stub(),
    onChangeDimension: sinon.stub(),
    onChangeMeasure: sinon.stub(),
    onChangeChartType: sinon.stub()
  };
}

describe('DataPane', function() {
  var component;

  beforeEach(function() {
    component = renderComponent(DataPane, defaultProps());
  });

  describe('rendering', function() {
    it('renders a datasetUid input', function() {
      expect(component.querySelector('input[type="text"]')).to.exist;
    });

    describe('without data', function() {
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

      it('renders three dropdowns', function() {
        expect(component.querySelectorAll('select').length).to.equal(3);

        expect(component.querySelector('[name="dimension-selection"]')).to.exist
        expect(component.querySelector('[name="measure-selection"]')).to.exist
        expect(component.querySelector('[name="chart-type-selection"]')).to.exist
      });
    });
  });

  describe('events', function() {
    var props;
    var component;

    beforeEach(function() {
      props = defaultProps();
      props.datasetMetadata.data = {};

      component = renderComponent(DataPane, props);
    });

    describe('when changing the dataset UID', function() {
      it('should emit an onChangeDatasetUid event', function() {
        var input = component.querySelector('input[type="text"]');
        TestUtils.Simulate.change(input);

        sinon.assert.calledOnce(props.onChangeDatasetUid);
      });
    });

    describe('when changing the dimension dropdown', function() {
      it('should emit an onChangeDimension event', function() {
        var dropdown = component.querySelector('[name="dimension-selection"]')
        TestUtils.Simulate.change(dropdown);

        sinon.assert.calledOnce(props.onChangeDimension);
      });
    });

    describe('when changing the measure dropdown', function() {
      it('should emit an onChangeMeasure event', function() {
        var dropdown = component.querySelector('[name="measure-selection"]')
        TestUtils.Simulate.change(dropdown);

        sinon.assert.calledOnce(props.onChangeMeasure);
      });
    });

    describe('when changing the chart type dropdown', function() {
      it('should emit an onChangeChartType event', function() {
        var dropdown = component.querySelector('[name="chart-type-selection"]')
        TestUtils.Simulate.change(dropdown);

        sinon.assert.calledOnce(props.onChangeChartType);
      });
    });
  });
});
