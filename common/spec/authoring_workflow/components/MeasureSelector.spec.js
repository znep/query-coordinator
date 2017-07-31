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
        expect(component.querySelector('#measure-selection')).to.exist;
        expect(component.querySelectorAll('#measure-selection .picklist-option').length).to.equal(4);
      });

      describe('with a measure selected', function() {
        beforeEach(function() {
          component = renderComponent(MeasureSelector, defaultProps({
            metadata: validMetadata,
            vifAuthoring: validVifAuthoring
          }));
        });

        it('renders measure aggregation selection', function() {
          expect(component.querySelector('#measure-aggregation-selection')).to.exist;
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
          expect(component.querySelector('#measure-selection.dropdown-disabled')).to.exist;
        });

        it('renders a flyout', function() {
          expect(component.querySelector('.measure-empty-flyout')).to.exist;
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
      onSelectMeasure: sinon.stub(),
      onSelectMeasureAggregation: sinon.stub()
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
      emitsDropdownEvent('#measure-selection', 'onSelectMeasure');
    });

    describe('when changing the measure aggregation dropdown', function() {
      emitsDropdownEvent('#measure-aggregation-selection', 'onSelectMeasureAggregation');
    });
  });
});
