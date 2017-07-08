import React from 'react';
import TestUtils from 'react-addons-test-utils';

import defaultProps from '../../defaultProps';
import renderComponent from '../../renderComponent';
import { DataPane } from 'common/authoring_workflow/components/panes/DataPane';
import { INPUT_DEBOUNCE_MILLISECONDS } from 'common/authoring_workflow/constants';

function render(type) {
  var props = defaultProps({
    vifAuthoring: { authoring: { selectedVisualizationType: type } },
    onSelectLimitNone: sinon.spy(),
    onSelectLimitCount: sinon.spy(),
    onChangeLimitCount: sinon.spy(),
    onChangeShowOtherCategory: sinon.spy(),
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

  describe('rendering', function() {
    describe('with an error', function() {
      it('renders a metadata error message', function() {
        var component = renderComponent(DataPane, defaultProps({
          metadata: { error: true }
        }));

        expect(component.querySelector('.metadata-error')).to.exist;
      });
    });

    describe('while loading', function() {
      it('renders a loading spinner', function() {
        var component = renderComponent(DataPane, defaultProps({
          metadata: { isLoading: true }
        }));

        expect(component.querySelector('.metadata-loading')).to.exist;
      });
    });

    describe('limit and other category', () => {

      ['barChart', 'columnChart', 'pieChart'].forEach((chartType) => {

        describe(`when the current visualization type is "${chartType}"`, () => {

          beforeEach(setUpVisualization(chartType));

          it('renders a limit none radio button', function() {
            expect(component.querySelector('#limit-none')).to.exist;

            if (chartType === 'pieChart') {
              expect(component.querySelector('#limit-none').hasAttribute('disabled')).to.equal(true);
            }
          });

          it('renders class \'disabled\' on #limit-none-container when in pie chart', () => {
            if (chartType === 'pieChart') {
              assert.isTrue(component.querySelector('#limit-none-container').classList.contains('disabled'))
            }
          });

          it('renders a limit count radio button', function() {
            expect(component.querySelector('#limit-count')).to.exist;
          });

          it('renders a limit count number input field', function() {
            expect(component.querySelector('#limit-count-value')).to.exist;
          });

          it('renders a show other category checkbox', function() {
            expect(component.querySelector('#show-other-category')).to.exist;
          });

          emitsEvent('#limit-none', 'onSelectLimitNone');
          emitsEvent('#limit-count', 'onSelectLimitCount');
          emitsEvent('#limit-count-value', 'onChangeLimitCount');
          emitsEvent('#show-other-category', 'onChangeShowOtherCategory');

          emitsEvent('#limit-count-value', 'onChangeLimitCount', 'keyDown', {key: 'Enter'});

        });
      });

      describe('when the current visualization type is not "barChart or pieChart or columnChart"', function() {

        beforeEach(setUpVisualization(''));

        it('renders a limit none radio button', function() {
          expect(component.querySelector('#limit-none')).to.not.exist;
        });

        it('renders a limit count radio button', function() {
          expect(component.querySelector('#limit-count')).to.not.exist;
        });

        it('renders a limit count number input field', function() {
          expect(component.querySelector('#limit-count-value')).to.not.exist;
        });

        it('renders a show other category checkbox', function() {
          expect(component.querySelector('#show-other-category')).to.not.exist;
        });
      });
    });
  });

  describe('timelineChart', function() {

    beforeEach(setUpVisualization('timelineChart'));

    rendersTimelinePrecision();
    rendersTreatNullValuesAsZeroAndEmitsEvents();
    // TODO: EN-9281 rendersScaleAndEmitsEvents();
  });
});
