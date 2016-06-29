import React from 'react';
import TestUtils from 'react-addons-test-utils';

import defaultProps from './defaultProps';
import renderComponent from './renderComponent';
import { AuthoringWorkflow } from 'src/authoringWorkflow/AuthoringWorkflow';
import vifs from 'src/authoringWorkflow/vifs';

function render(type) {
  var props = defaultProps({
    vifAuthoring: { authoring: { selectedVisualizationType: type } },
    onChangeXAxisScalingMode: sinon.spy(),
    onComplete: sinon.spy(),
    onCancel: sinon.spy()
  });

  return {
    props: props,
    component: renderComponent(AuthoringWorkflow, props)
  };
}


describe('AuthoringWorkflow', function() {
  var component;
  var props;

  function setUpVisualization(type) {
    return function() {
      var renderedParts = render(type);

      component = renderedParts.component;
      props = renderedParts.props;
    };
  }

  function emitsEvent(id, eventName) {
    it(`should emit an ${eventName} event`, function() {
      TestUtils.Simulate.change(component.querySelector(id));
      sinon.assert.calledOnce(props[eventName]);
    });
  }

  function rendersXAxisScalingModeAndEmitsEvents() {
    describe('rendering', function() {
      it('renders a x-axis scaling dropdown', function() {
        expect(component.querySelector('#x-axis-scaling-mode')).to.exist;
      });
    });

    describe('events', function() {
      describe('when changing the x-axis scaling mode', function() {
        emitsEvent('#x-axis-scaling-mode', 'onChangeXAxisScalingMode');
      });
    });
  }

  beforeEach(setUpVisualization());

  describe('rendering', function() {
    it('renders the done button', function() {
      expect(component).to.contain('button.done');
    });

    it('renders the cancel button', function() {
      expect(component).to.contain('button.cancel');
    });

    it('renders the modal close button', function() {
      expect(component).to.contain('.modal-header-dismiss');
    });
  });

  describe('events', function() {
    it('calls the onComplete callback when the done button is clicked', function() {
      // Make a valid visualization
      _.set(props.vifAuthoring.vifs.columnChart, 'series[0].dataSource.domain', 'something');
      _.set(props.vifAuthoring.vifs.columnChart, 'series[0].dataSource.datasetUid', 'something');
      _.set(props.vifAuthoring.vifs.columnChart, 'series[0].dataSource.dimension.columnName', 'something');

      var component = renderComponent(AuthoringWorkflow, props);

      sinon.assert.notCalled(props.onComplete);
      TestUtils.Simulate.click(component.querySelector('button.done'));

      sinon.assert.calledOnce(props.onComplete);
      sinon.assert.calledWithExactly(props.onComplete, { vif: props.vif });

    });

    it('calls the onCancel callback when the cancel button is clicked', function() {
      sinon.assert.notCalled(props.onCancel);
      TestUtils.Simulate.click(component.querySelector('button.cancel'));
      sinon.assert.calledOnce(props.onCancel);
    });
  });

  describe('columnChart', function() {
    beforeEach(setUpVisualization('timelineChart'));
    rendersXAxisScalingModeAndEmitsEvents();
  });

  describe('timelineChart', function() {
    beforeEach(setUpVisualization('timelineChart'));
    rendersXAxisScalingModeAndEmitsEvents();
  });
});
