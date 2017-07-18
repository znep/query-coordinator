import React from 'react';
import TestUtils from 'react-addons-test-utils';

import defaultProps from '../defaultProps';
import renderComponent from '../renderComponent';
import { MeasureSelector } from 'common/authoring_workflow/components/MeasureSelector';

var validMetadata = {
  data: {
    columns: [
      {name: 'Money', fieldName: 'money', renderTypeName: 'money'},
      {name: 'Number', fieldName: 'number', renderTypeName: 'number'},
      {name: 'Percent', fieldName: 'percent', renderTypeName: 'percent'}
    ]
  },
  phidippidesMetadata: {
    columns: {
      money: {name: 'Money', renderTypeName: 'money'},
      number: {name: 'Number', renderTypeName: 'number'},
      percent: {name: 'Percent', renderTypeName: 'percent'}
    }
  }
};

var nonNumericMetadata = {
  data: {
    columns: [
      {name: 'Text', fieldName: 'text', renderTypeName: 'text'}
    ]
  },
  phidippidesMetadata: {
    columns: {
      number: {name: 'Text', renderTypeName: 'text'}
    }
  }
};

var validVifAuthoring = {
  vifs: {
    columnChart: {series: [{dataSource: {measure: {columnName: 'columnName'}}}]}
  }
};

describe('MeasureSelector', function() {
  describe('rendering', function() {
    var component;

    describe('without data', function() {
      beforeEach(function() {
        component = renderComponent(MeasureSelector, defaultProps({
          metadata: { data: null }
        }));
      });

      it('does not render a dropdown', function() {
        expect(component).to.be.null;
      });
    });

    describe('with data', function() {
      beforeEach(function() {
        component = renderComponent(MeasureSelector, defaultProps({
          metadata: validMetadata
        }));
      });

      it('renders measure selection', function() {
        expect(component.querySelector('#measure-selection-0')).to.exist;
        expect(component.querySelectorAll('#measure-selection-0 .picklist-option').length).to.equal(4);
      });

      describe('with a measure selected', function() {
        beforeEach(function() {
          component = renderComponent(MeasureSelector, defaultProps({
            metadata: validMetadata,
            vifAuthoring: validVifAuthoring
          }));
        });

        it('renders measure aggregation selection', function() {
          expect(component.querySelector('#measure-aggregation-selection-0')).to.exist;
        });
      });

      describe('when there are no numeric columns', function() {
        beforeEach(function() {
          component = renderComponent(MeasureSelector, defaultProps({
            metadata: nonNumericMetadata,
            vifAuthoring: validVifAuthoring
          }));
        });

        it('renders a disabled selector', function() {
          expect(component.querySelector('#measure-selection-0.dropdown-disabled')).to.exist;
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
      onSetMeasureColumn: sinon.stub(),
      onSetMeasureAggregation: sinon.stub()
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
      component = renderComponent(MeasureSelector, props);
    });

    describe('when changing the measure dropdown', function() {
      emitsDropdownEvent('#measure-selection-0', 'onSetMeasureColumn');
    });

    describe('when changing the measure aggregation dropdown', function() {
      emitsDropdownEvent('#measure-aggregation-selection-0', 'onSetMeasureAggregation');
    });
  });
});
