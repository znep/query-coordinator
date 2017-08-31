import React from 'react';
import TestUtils from 'react-addons-test-utils';
import defaultProps from '../defaultProps';
import renderComponent from '../renderComponent';
import { ErrorBarsOptions } from 'common/authoring_workflow/components/ErrorBarsOptions';

var validMetadata = {
  data: {
    columns: [
      {name: 'Money', fieldName: 'money', renderTypeName: 'money'},
      {name: 'Number', fieldName: 'number', renderTypeName: 'number'},
      {name: 'Percent', fieldName: 'percent', renderTypeName: 'percent'}
    ]
  }
};

var nonNumericMetadata = {
  data: {
    columns: [
      {name: 'Text', fieldName: 'text', renderTypeName: 'text'}
    ]
  }
};

var validVifAuthoring = {
  vifs: {
    columnChart: {series: [{dataSource: {measure: {columnName: 'columnName'}}}]}
  }
};

describe('ErrorBarsOptions', function() {

  describe('rendering', function() {
    var component;

    describe('without data', function() {
      beforeEach(function() {
        component = renderComponent(ErrorBarsOptions, defaultProps({
          metadata: { data: null }
        }));
      });

      it('does not render a dropdown', function() {
        assert.isNull(component);
      });
    });

    describe('with data', function() {
      beforeEach(function() {
        component = renderComponent(ErrorBarsOptions, defaultProps({
          metadata: validMetadata
        }));
      });

      it('renders column name selection', function() {
        assert.isNotNull(component.querySelector('#error-bars-lower-bound-column-selection'));
        assert.equal(component.querySelectorAll('#error-bars-lower-bound-column-selection .picklist-option').length, 4);
        assert.isNotNull(component.querySelector('#error-bars-upper-bound-column-selection'));
        assert.equal(component.querySelectorAll('#error-bars-upper-bound-column-selection .picklist-option').length, 4);
      });

      it('renders bar color picker', function() {
        assert.isNotNull(component.querySelector('#error-bars-bar-color-picker'));
      });

      describe('when there are no numeric columns', function() {
        beforeEach(function() {
          component = renderComponent(ErrorBarsOptions, defaultProps({
            metadata: nonNumericMetadata,
            vifAuthoring: validVifAuthoring
          }));
        });

        it('renders a disabled selector', function() {
          assert.isNotNull(component.querySelector('#error-bars-lower-bound-column-selection.dropdown-disabled'));
          assert.isNotNull(component.querySelector('#error-bars-upper-bound-column-selection.dropdown-disabled'));
        });
      });
    });
  });

  describe('events', function() {
    var props;
    var component;
    var overrides = {
      metadata: validMetadata,
      vifAuthoring: validVifAuthoring,
      onSelectErrorBarsLowerBoundColumn: sinon.stub(),
      onSelectErrorBarsUpperBoundColumn: sinon.stub()
    };

    var emitsDropdownEvent = function(selector, eventName) {
      it(`should emit an ${eventName} event.`, function() {
        var option = component.querySelector(`${selector} .picklist-option`);
        TestUtils.Simulate.click(option);
        sinon.assert.calledOnce(props[eventName]);
      });
    };

    beforeEach(function() {
      props = defaultProps(overrides);
      component = renderComponent(ErrorBarsOptions, props);
    });

    describe('when changing the lower bound column name dropdown', function() {
      emitsDropdownEvent('#error-bars-lower-bound-column-selection', 'onSelectErrorBarsLowerBoundColumn');
    });

    describe('when changing the upper bound column name dropdown', function() {
      emitsDropdownEvent('#error-bars-upper-bound-column-selection', 'onSelectErrorBarsUpperBoundColumn');
    });
  });
});
