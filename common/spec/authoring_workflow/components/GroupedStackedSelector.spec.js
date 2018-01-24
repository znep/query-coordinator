import React from 'react';
import TestUtils from 'react-dom/test-utils';

import defaultProps from '../defaultProps';
import renderComponent from '../renderComponent';
import { GroupedStackedSelector } from 'common/authoring_workflow/components/GroupedStackedSelector';
import { getInputDebounceMs } from 'common/authoring_workflow/constants';

function render(type) {
  var props = defaultProps({
    vifAuthoring: { authoring: { selectedVisualizationType: type } },
    onSelectGrouped: sinon.spy(),
    onSelectStacked: sinon.spy(),
    onSelectOneHundredPercentStacked: sinon.spy()
  });

  return {
    props: props,
    component: renderComponent(GroupedStackedSelector, props)
  };
}

describe('GroupedStackedSelector', function() {
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
      }, getInputDebounceMs());
    });
  }

  describe('rendering the grouped stacked selector', () => {

    ['barChart', 'columnChart', 'pieChart'].forEach((chartType) => {

      describe(`when the current visualization type is "${chartType}"`, () => {

        beforeEach(setUpVisualization(chartType));

        it('renders a grouped radio button', () => {
          assert.isNotNull(component.querySelector('#display-grouped'));
        });

        it('renders a stacked radio button', () => {
          assert.isNotNull(component.querySelector('#display-stacked'));
        });

        it('renders a 100% stacked radio button', () => {
          assert.isNotNull(component.querySelector('#display-100-percent-stacked'));
        });

        emitsEvent('#display-grouped', 'onSelectGrouped');
        emitsEvent('#display-stacked', 'onSelectStacked');
        emitsEvent('#display-100-percent-stacked', 'onSelectOneHundredPercentStacked');
      });
    });
  });
});
