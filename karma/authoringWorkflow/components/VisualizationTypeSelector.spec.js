import React from 'react';
import TestUtils from 'react-addons-test-utils';

import defaultProps from '../defaultProps';
import renderComponent from '../renderComponent';
import { VisualizationTypeSelector } from 'src/authoringWorkflow/components/VisualizationTypeSelector';

describe('VisualizationTypeSelector', function() {
  describe('rendering', function() {
    var component;

    describe('without data', function() {
      beforeEach(function() {
        component = renderComponent(VisualizationTypeSelector, defaultProps({
          metadata: { data: null }
        }));
      });

      it('does not render a dropdown', function() {
        expect(component).to.be.null;
      });
    });

    describe('with data', function() {
      beforeEach(function() {
        component = renderComponent(VisualizationTypeSelector, defaultProps());
      });

      it('renders visualization type selection', function() {
        expect(component.querySelector('#visualization-type-selection')).to.exist;
      });
    });
  });

  describe('events', function() {
    var props;
    var component;
    var overrides = {
      onSelectVisualizationType: sinon.stub()
    };

    var emitsDropdownEvent = function(selector, eventName) {
      it(`should emit an ${eventName} event.`, function() {
        var option = component.querySelector(`${selector} .dropdown-option`);
        TestUtils.Simulate.click(option);
        sinon.assert.calledOnce(props[eventName]);
      });
    };

    beforeEach(function() {
      props = defaultProps(overrides);
      component = renderComponent(VisualizationTypeSelector, props);
    });

    describe('when changing the visualization type dropdown', function() {
      emitsDropdownEvent('#visualization-type-selection', 'onSelectVisualizationType');
    });
  });
});
