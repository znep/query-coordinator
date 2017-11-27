import $ from 'jquery';
import React from 'react';
import TestUtils from 'react-dom/test-utils';
import defaultProps from '../defaultProps';
import renderComponent from '../renderComponent';
import { TimelinePrecisionSelector } from 'common/authoring_workflow/components/TimelinePrecisionSelector';
import { INPUT_DEBOUNCE_MILLISECONDS } from 'common/authoring_workflow/constants';
import { setDataSource } from '../../../authoring_workflow/actions';

function render(type, dimensionColumnName) {
  const props = defaultProps({
    vifAuthoring: {
      authoring: { selectedVisualizationType: type },
      vifs: {
        timelineChart: {
          series: [{
            dataSource: {
              dimension: {
                columnName: dimensionColumnName,
                aggregationFunction: null
              }
            }
          }]
        }
      }
    },
    metadata: {
      data: {
        columns: [
          { name: 'number', fieldName: 'number', renderTypeName: 'number' },
          { name: 'calendar_Date', fieldName: 'calendar_date', renderTypeName: 'calendar_date' }
        ]
      }
    },
    onSelectTimelinePrecision: sinon.spy()
  });

  return {
    props: props,
    component: renderComponent(TimelinePrecisionSelector, props)
  };
}

describe('TimelinePrecisionSelector', () => {
  let component;
  let props;

  function setUpVisualization(type, dimensionColumnName = 'calendar_date') {
    return () => {
      const renderedParts = render(type, dimensionColumnName);
      component = renderedParts.component;
      props = renderedParts.props;
    };
  }

  function emitsEvent(id, eventName, eventType, eventParams) {
    it(`should emit an ${eventName} event`, (done) => {
      TestUtils.Simulate[eventType || 'change'](component.querySelector(id), eventParams);

      setTimeout(() => {
        sinon.assert.calledOnce(props[eventName]);
        done();
      }, INPUT_DEBOUNCE_MILLISECONDS);
    });
  }

  function rendersTimelinePrecision() {
    describe('rendering', () => {
      it('renders a dropdown with timeline precision options', () => {
        assert.isNotNull(component.querySelector('#timeline-precision-selection'));
      });
    });

    describe('events', () => {
      describe('when changing the timeline precision order', () => {
        emitsEvent('#timeline-precision-selection .picklist-option', 'onSelectTimelinePrecision', 'click');
      });
    });
  }

  describe('timelineChart', () => {
    beforeEach(setUpVisualization('timelineChart'));

    rendersTimelinePrecision();

    describe('when dimension is not a calendar_date', () => {
      beforeEach(setUpVisualization('timelineChart', 'number'));

      it('renders as disabled', () => {
        const control = component.querySelector('#timeline-precision-selection');
        const isDisabled = $(control).hasClass('dropdown-disabled');
        assert.isTrue(isDisabled);
      });
    });

    describe('when dimension is a calendar_date', () => {
      beforeEach(setUpVisualization('timelineChart'));

      it('renders as enabled', () => {
        const control = component.querySelector('#timeline-precision-selection');
        const isDisabled = $(control).hasClass('dropdown-disabled');
        assert.isFalse(isDisabled);
      });
    });
  });

  describe('columnChart', () => {
    beforeEach(setUpVisualization('columnChart'));

    rendersTimelinePrecision();
  });
});
