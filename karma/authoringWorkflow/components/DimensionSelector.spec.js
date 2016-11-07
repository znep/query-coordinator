import React from 'react';
import TestUtils from 'react-addons-test-utils';

import defaultProps from '../defaultProps';
import renderComponent from '../renderComponent';
import { DimensionSelector } from 'src/authoringWorkflow/components/DimensionSelector';

describe('DimensionSelector', function() {
  describe('rendering', function() {
    var component;

    describe('without data', function() {
      beforeEach(function() {
        component = renderComponent(DimensionSelector, defaultProps({
          metadata: { data: null }
        }));
      });

      it('does not render a picklist', function() {
        expect(component).to.be.null;
      });
    });

    describe('with data', function() {
      beforeEach(function() {
        component = renderComponent(DimensionSelector, defaultProps());
      });

      it('renders dimension selection', function() {
        expect(component.querySelector('#dimension-selection')).to.exist;
      });
    });
  });

  describe('events', function() {
    var props;
    var component;
    var overrides = {
      onSelectDimension: sinon.stub()
    };

    var emitsPicklistEvent = function(selector, eventName) {
      it(`should emit an ${eventName} event.`, function() {
        var option = component.querySelector(`${selector} .picklist-option`);
        TestUtils.Simulate.click(option);
        sinon.assert.calledOnce(props[eventName]);
      });
    };

    beforeEach(function() {
      props = defaultProps(overrides);
      component = renderComponent(DimensionSelector, props);
    });

    describe('when changing the dimension dropdown', function() {
      emitsPicklistEvent('#dimension-selection', 'onSelectDimension');
    });
  });
});