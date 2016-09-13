import React from 'react';
import TestUtils from 'react-addons-test-utils';

import defaultProps from '../../defaultProps';
import renderComponent from '../../renderComponent';
import vifs from 'src/authoringWorkflow/vifs';
import { AxisAndScalePane } from 'src/authoringWorkflow/components/panes/AxisAndScalePane';

function render(type) {
  var props = defaultProps({
    vifAuthoring: { authoring: { selectedVisualizationType: type } },
    onChangeLabelBottom: sinon.spy(),
    onChangeLabelLeft: sinon.spy(),
    onChangeXAxisDataLabels: sinon.spy(),
    onSelectChartSorting: sinon.spy(),
    onSelectTimelinePrecision: sinon.spy(),
    onChangeTreatNullValuesAsZero: sinon.spy()
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
    it(`should emit an ${eventName} event`, function() {
      TestUtils.Simulate[eventType || 'change'](component.querySelector(id));
      sinon.assert.calledOnce(props[eventName]);
    });
  }

  function rendersLabelsAndEmitsEvents() {
    describe('rendering', function() {
      it('renders a bottom label input', function() {
        expect(component.querySelector('#label-bottom')).to.exist;
      });

      it('renders a left label input', function() {
        expect(component.querySelector('#label-left')).to.exist;
      });
    });

    describe('events', function() {
      describe('when changing the bottom label', function() {
        emitsEvent('#label-bottom', 'onChangeLabelBottom');
      });

      describe('when changing the left label', function() {
        emitsEvent('#label-left', 'onChangeLabelLeft');
      });
    });
  }

  function rendersXAxisDataLabelsAndEmitsEvents() {
    describe('rendering', function() {
      it('renders a show x-axis data labels checkbox', function() {
        expect(component.querySelector('#x-axis-data-labels')).to.exist;
      });
    });

    describe('events', function() {
      describe('when changing the x-axis data labels checkbox', function() {
        emitsEvent('#x-axis-data-labels', 'onChangeXAxisDataLabels');
      });
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

  function rendersTimelinePrecision() {
    describe('rendering', function() {
      it('renders a dropdown with timeline precision options', function() {
        expect(component.querySelector('#timeline-precision-selection')).to.exist;
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
        expect(component.querySelector('#treat-null-values-as-zero')).to.exist;
      });
    });

    describe('events', function() {
      describe('when changing the treat null values as zero checkbox', function() {
        emitsEvent('#treat-null-values-as-zero', 'onChangeTreatNullValuesAsZero');
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

  describe('columnChart', function() {
    beforeEach(setUpVisualization('columnChart'));
    rendersLabelsAndEmitsEvents();
    rendersXAxisDataLabelsAndEmitsEvents();
    rendersChartSortingAndEmitsEvents();
  });

  describe('histogram', function() {
    beforeEach(setUpVisualization('histogram'));
    rendersLabelsAndEmitsEvents();
  });

  describe('timelineChart', function() {
    beforeEach(setUpVisualization('timelineChart'));
    rendersLabelsAndEmitsEvents();
    rendersTimelinePrecision();
    rendersTreatNullValuesAsZeroAndEmitsEvents();
  });
});
