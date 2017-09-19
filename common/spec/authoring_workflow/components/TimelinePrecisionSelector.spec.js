import React from 'react';
import TestUtils from 'react-dom/test-utils';
import defaultProps from '../defaultProps';
import renderComponent from '../renderComponent';
import { TimelinePrecisionSelector } from 'common/authoring_workflow/components/TimelinePrecisionSelector';
import { INPUT_DEBOUNCE_MILLISECONDS } from 'common/authoring_workflow/constants';

function render(type) {
  var props = defaultProps({
    vifAuthoring: { authoring: { selectedVisualizationType: type } },
    onSelectTimelinePrecision: sinon.spy()
  });

  return {
    props: props,
    component: renderComponent(TimelinePrecisionSelector, props)
  };
}

describe('TimelinePrecisionSelector', function() {
  var component;
  var props;

  function setUpVisualization(type) {
    return function() {
      var renderedParts = render(type);

      component = renderedParts.component;
      props = renderedParts.props;
    };
  }

  function emitsEvent(id, eventName, eventType, eventParams) {
    it(`should emit an ${eventName} event`, function(done) {
      TestUtils.Simulate[eventType || 'change'](component.querySelector(id), eventParams);

      setTimeout(() => {
        sinon.assert.calledOnce(props[eventName]);
        done();
      }, INPUT_DEBOUNCE_MILLISECONDS);
    });
  }

  function rendersTimelinePrecision() {
    describe('rendering', function() {
      it('renders a dropdown with timeline precision options', function() {
        assert.isNotNull(component.querySelector('#timeline-precision-selection'));
      });
    });

    describe('events', function() {
      describe('when changing the timeline precision order', function() {
        emitsEvent('#timeline-precision-selection .picklist-option', 'onSelectTimelinePrecision', 'click');
      });
    });
  }

  describe('timelineChart', function() {
    beforeEach(setUpVisualization('timelineChart'));

    rendersTimelinePrecision();
  });

  describe('columnChart', function() {
    beforeEach(setUpVisualization('columnChart'));

    rendersTimelinePrecision();
  });
});
