import React from 'react';
import TestUtils from 'react-addons-test-utils';

import defaultProps from '../defaultProps';
import renderComponent from '../renderComponent';
import { DisplayOptions } from 'common/authoring_workflow/components/DisplayOptions';
import { INPUT_DEBOUNCE_MILLISECONDS } from 'common/authoring_workflow/constants';

function render(type) {
  var props = defaultProps({
    vifAuthoring: { authoring: { selectedVisualizationType: type } },
    onSelectLimitNone: sinon.spy(),
    onSelectLimitCount: sinon.spy(),
    onChangeLimitCount: sinon.spy(),
    onChangeShowOtherCategory: sinon.spy(),
  });

  return {
    props: props,
    component: renderComponent(DisplayOptions, props)
  };
}

describe('DisplayOptions', function() {
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

  describe('rendering', function() {
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
    });
  });
});
