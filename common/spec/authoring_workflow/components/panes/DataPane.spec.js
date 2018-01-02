import React from 'react';
import TestUtils from 'react-dom/test-utils';

import defaultProps from '../../defaultProps';
import renderComponent from '../../renderComponent';
import { DataPane } from 'common/authoring_workflow/components/panes/DataPane';
import { INPUT_DEBOUNCE_MILLISECONDS } from 'common/authoring_workflow/constants';
import { FeatureFlags } from 'common/feature_flags';

function render(type) {
  var props = defaultProps({
    vifAuthoring: { authoring: { selectedVisualizationType: type } },
    onSelectTimelinePrecision: sinon.spy(),
    onChangeTreatNullValuesAsZero: sinon.spy(),
    onChangeXAxisScalingMode: sinon.spy()
  });

  return {
    props: props,
    component: renderComponent(DataPane, props)
  };
}

describe('DataPane', () => {
  var component;
  var props;

  function setUpVisualization(type) {
    FeatureFlags.updateTestFixture({ enable_new_maps: false });

    return () => {
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

  function rendersTreatNullValuesAsZeroAndEmitsEvents() {
    describe('rendering', () => {
      it('renders a treat null values as zero checkbox', () => {
        assert.isNotNull(component.querySelector('#treat-null-values-as-zero'));
      });
    });

    describe('events', () => {
      describe('when changing the treat null values as zero checkbox', () => {
        emitsEvent('#treat-null-values-as-zero', 'onChangeTreatNullValuesAsZero');
      });
    });
  }

  function rendersXAxisScaleMode() {
    describe('rendering', () => {
      it('renders a "scales to fit chart area" checkbox', () => {
        assert.isNotNull(component.querySelector('#x-axis-scaling-mode'));
      });
    });

    describe('events', () => {
      describe('when changing the "scales to fit chart area" checkbox', () => {
        emitsEvent('#x-axis-scaling-mode', 'onChangeXAxisScalingMode');
      });
    });
  }

  describe('rendering', () => {
    describe('with an error', () => {
      it('renders a metadata error message', () => {
        var component = renderComponent(DataPane, defaultProps({
          metadata: { error: true }
        }));

        assert.isNotNull(component.querySelector('.metadata-error'));
      });
    });

    describe('while loading', () => {
      it('renders a loading spinner', () => {
        var component = renderComponent(DataPane, defaultProps({
          metadata: { isLoading: true }
        }));

        assert.isNotNull(component.querySelector('.metadata-loading'));
      });
    });
  });

  describe('when the current visualization type is not "barChart or pieChart or columnChart"', () => {

    beforeEach(setUpVisualization(''));

    it('does not render a limit none radio button', () => {
      assert.isNull(component.querySelector('#limit-none'));
    });

    it('does not render a limit count radio button', () => {
      assert.isNull(component.querySelector('#limit-count'));
    });

    it('does not render a limit count number input field', () => {
      assert.isNull(component.querySelector('#limit-count-value'));
    });

    it('does not render a show other category checkbox', () => {
      assert.isNull(component.querySelector('#show-other-category'));
    });
  });

  describe('timelineChart', () => {
    beforeEach(setUpVisualization('timelineChart'));

    rendersTreatNullValuesAsZeroAndEmitsEvents();
    rendersXAxisScaleMode();
    // TODO: EN-9281 rendersScaleAndEmitsEvents();
  });
});
