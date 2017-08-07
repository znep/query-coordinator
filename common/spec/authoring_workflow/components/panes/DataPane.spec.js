import React from 'react';
import TestUtils from 'react-addons-test-utils';

import defaultProps from '../../defaultProps';
import renderComponent from '../../renderComponent';
import { DataPane } from 'common/authoring_workflow/components/panes/DataPane';
import { INPUT_DEBOUNCE_MILLISECONDS } from 'common/authoring_workflow/constants';

function render(type) {
  var props = defaultProps({
    vifAuthoring: { authoring: { selectedVisualizationType: type } },
    onSelectTimelinePrecision: sinon.spy(),
    onChangeTreatNullValuesAsZero: sinon.spy()
  });

  return {
    props: props,
    component: renderComponent(DataPane, props)
  };
}

describe('DataPane', function() {
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

  function rendersTreatNullValuesAsZeroAndEmitsEvents() {
    describe('rendering', function() {
      it('renders a treat null values as zero checkbox', function() {
        assert.isNotNull(component.querySelector('#treat-null-values-as-zero'));
      });
    });

    describe('events', function() {
      describe('when changing the treat null values as zero checkbox', function() {
        emitsEvent('#treat-null-values-as-zero', 'onChangeTreatNullValuesAsZero');
      });
    });
  }

  describe('rendering', function() {
    describe('with an error', function() {
      it('renders a metadata error message', function() {
        var component = renderComponent(DataPane, defaultProps({
          metadata: { error: true }
        }));

        assert.isNotNull(component.querySelector('.metadata-error'));
      });
    });

    describe('while loading', function() {
      it('renders a loading spinner', function() {
        var component = renderComponent(DataPane, defaultProps({
          metadata: { isLoading: true }
        }));

        assert.isNotNull(component.querySelector('.metadata-loading'));
      });
    });
  });

  describe('when the current visualization type is not "barChart or pieChart or columnChart"', function() {

    beforeEach(setUpVisualization(''));

    it('does not render a limit none radio button', function() {
      assert.isNull(component.querySelector('#limit-none'));
    });

    it('does not render a limit count radio button', function() {
      assert.isNull(component.querySelector('#limit-count'));
    });

    it('does not render a limit count number input field', function() {
      assert.isNull(component.querySelector('#limit-count-value'));
    });

    it('does not render a show other category checkbox', function() {
      assert.isNull(component.querySelector('#show-other-category'));
    });
  });

  describe('timelineChart', function() {
    beforeEach(setUpVisualization('timelineChart'));

    rendersTimelinePrecision();
    rendersTreatNullValuesAsZeroAndEmitsEvents();
    // TODO: EN-9281 rendersScaleAndEmitsEvents();
  });
});
