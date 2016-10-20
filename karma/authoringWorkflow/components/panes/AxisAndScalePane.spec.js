import React from 'react';
import TestUtils from 'react-addons-test-utils';

import defaultProps from '../../defaultProps';
import renderComponent from '../../renderComponent';
import vifs from 'src/authoringWorkflow/vifs';
import { AxisAndScalePane } from 'src/authoringWorkflow/components/panes/AxisAndScalePane';

function render(type) {
  var props = defaultProps({
    vifAuthoring: { authoring: { selectedVisualizationType: type } },
    onChangeLabelTop: sinon.spy(),
    onChangeLabelBottom: sinon.spy(),
    onChangeLabelLeft: sinon.spy(),
    onChangeShowDimensionLabels: sinon.spy(),
    onChangeShowValueLabels: sinon.spy(),
    onChangeShowValueLabelsAsPercent: sinon.spy(),
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

  function rendersTopAndLeftLabelsAndEmitsEvents() {
    describe('rendering', function() {
      it('renders a top label input', function() {
        expect(component.querySelector('#label-top')).to.exist;
      });

      it('renders a left label input', function() {
        expect(component.querySelector('#label-left')).to.exist;
      });
    });

    describe('events', function() {
      describe('when changing the top label', function() {
        emitsEvent('#label-top', 'onChangeLabelTop');
      });

      describe('when changing the left label', function() {
        emitsEvent('#label-left', 'onChangeLabelLeft');
      });
    });
  }

  function rendersBottomAndLeftLabelsAndEmitsEvents() {
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

  function rendersShowDimensionLabelsAndEmitsEvents() {
    describe('rendering', function() {
      it('renders a show dimension labels checkbox', function() {
        expect(component.querySelector('#show-dimension-labels')).to.exist;
      });
    });

    describe('events', function() {
      describe('when changing the show dimension labels checkbox', function() {
        emitsEvent('#show-dimension-labels', 'onChangeShowDimensionLabels');
      });
    });
  }

  function rendersShowValueLabelsAndEmitsEvents() {
    describe('rendering', function() {
      it('renders a show value labels checkbox', function() {
        expect(component.querySelector('#show-value-labels')).to.exist;
      });
    });

    describe('events', function() {
      describe('when changing the show value labels checkbox', function() {
        emitsEvent('#show-value-labels', 'onChangeShowValueLabels');
      });
    });
  }

  function rendersShowValueLabelsAsPercentAndEmitEvents() {
    describe('rendering', function() {
      it('renders a show value labels as percentage checkbox', function() {
        expect(component.querySelector('#show-value-labels-as-percent')).to.exist;
      });
    });

    describe('events', function () {
      describe('when changing the show value labels as percent checkbox', function () {
        emitsEvent('#show-value-labels-as-percent', 'onChangeShowValueLabelsAsPercent');
      })
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

  describe('barChart', function() {

    beforeEach(setUpVisualization('barChart'));

    rendersTopAndLeftLabelsAndEmitsEvents();
    rendersShowDimensionLabelsAndEmitsEvents();
    rendersShowValueLabelsAndEmitsEvents();
    rendersChartSortingAndEmitsEvents();
  });

  describe('columnChart', function() {

    beforeEach(setUpVisualization('columnChart'));

    rendersBottomAndLeftLabelsAndEmitsEvents();
    rendersShowDimensionLabelsAndEmitsEvents();
    rendersChartSortingAndEmitsEvents();
  });

  describe('histogram', function() {

    beforeEach(setUpVisualization('histogram'));

    rendersBottomAndLeftLabelsAndEmitsEvents();
  });

  describe('timelineChart', function() {

    beforeEach(setUpVisualization('timelineChart'));

    rendersBottomAndLeftLabelsAndEmitsEvents();
    rendersTimelinePrecision();
    rendersTreatNullValuesAsZeroAndEmitsEvents();
  });

  describe('pieChart', () => {
    beforeEach(setUpVisualization('pieChart'));

    rendersShowValueLabelsAndEmitsEvents();
    rendersShowValueLabelsAsPercentAndEmitEvents();
    rendersChartSortingAndEmitsEvents();
  });
});
