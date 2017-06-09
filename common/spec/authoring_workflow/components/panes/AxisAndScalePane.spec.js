import React from 'react';
import TestUtils from 'react-addons-test-utils';

import defaultProps from '../../defaultProps';
import renderComponent from '../../renderComponent';
import vifs from 'common/authoring_workflow/vifs';
import { AxisAndScalePane } from 'common/authoring_workflow/components/panes/AxisAndScalePane';
import { INPUT_DEBOUNCE_MILLISECONDS } from 'common/authoring_workflow/constants';

function render(type) {
  var props = defaultProps({
    vifAuthoring: { authoring: { selectedVisualizationType: type } },
    measureAxisScaleControl: 'custom',
    onSelectChartSorting: sinon.spy(),
    onMeasureAxisMinValueChange: sinon.spy(),
    onMeasureAxisMaxValueChange: sinon.spy()
  });

  return {
    props: props,
    component: renderComponent(AxisAndScalePane, props)
  };
}

describe('AxisAndScalePane', function() {
  var component;
  var props;

  function setUpVisualization(type) {
    return function() {
      var renderedParts = render(type);

      component = renderedParts.component;
      props = renderedParts.props;
    };
  }

  function emitsEvent(id, eventName, eventType) {
    it(`should emit an ${eventName} event`, function(done) {
      TestUtils.Simulate[eventType || 'change'](component.querySelector(id));
      setTimeout(() => {
        sinon.assert.calledOnce(props[eventName]);
        done();
      }, INPUT_DEBOUNCE_MILLISECONDS);
    });
  }

  function rendersChartSortingAndEmitsEvents() {
    describe('rendering', function() {
      it('renders a dropdown with chart sorting options', function() {
        expect(component.querySelector('#chart-sorting-selection')).to.exist;
      });
    });

    describe('events', function() {
      describe('when changing the chart sorting order', function() {
        emitsEvent('#chart-sorting-selection .picklist-option', 'onSelectChartSorting', 'click');
      });
    });
  }

  function rendersScaleAndEmitsEvents() {
    describe('rendering', function() {
      it('renders automatic selection', function() {
        expect(component.querySelector('#measure-axis-scale-automatic')).to.exist;
      });

      it('renders custom selection', function() {
        expect(component.querySelector('#measure-axis-scale-custom')).to.exist;
      });

      it('renders min input', function() {
        expect(component.querySelector('#measure-axis-scale-custom-min')).to.exist;
      });

      it('renders max input', function() {
        expect(component.querySelector('#measure-axis-scale-custom-max')).to.exist;
      });
    });

    describe('events', function() {
      describe('when clicking #measure-axis-scale-custom-min', function() {
        emitsEvent('#measure-axis-scale-custom-min', 'onMeasureAxisMinValueChange');
      });

      describe('when clicking #measure-axis-scale-custom-max', function() {
        emitsEvent('#measure-axis-scale-custom-max', 'onMeasureAxisMaxValueChange');
      });

    });
  }

  describe('without a visualization type', function() {
    beforeEach(function() {
      var renderedParts = render(null);

      component = renderedParts.component;
      props = renderedParts.props;
    });

    describe('rendering', function() {
      it('renders an empty pane info message', function() {
        expect(component.querySelector('.authoring-empty-pane')).to.exist;
      });
    });
  });

  describe('barChart', function() {

    beforeEach(setUpVisualization('barChart'));

    // TODO: EN-9281 rendersScaleAndEmitsEvents();
    rendersChartSortingAndEmitsEvents();
  });

  describe('columnChart', function() {

    beforeEach(setUpVisualization('columnChart'));

    rendersChartSortingAndEmitsEvents();
    // TODO: EN-9281 rendersScaleAndEmitsEvents();
  });

  describe('histogram', function() {

    beforeEach(setUpVisualization('histogram'));

    // TODO: EN-9281 rendersScaleAndEmitsEvents();
  });

  describe('timelineChart', function() {

    beforeEach(setUpVisualization('timelineChart'));

    // TODO: EN-9281 rendersScaleAndEmitsEvents();
  });

  describe('pieChart', () => {
    beforeEach(setUpVisualization('pieChart'));

    rendersChartSortingAndEmitsEvents();
  });
});
