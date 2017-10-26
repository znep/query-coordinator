import React from 'react';
import TestUtils from 'react-dom/test-utils';

import defaultProps from '../defaultProps';
import renderComponent from '../renderComponent';
import { MeasureSelector } from 'common/authoring_workflow/components/MeasureSelector';

var validMetadata = {
  data: {
    columns: [
      { name: 'Money', fieldName: 'money', renderTypeName: 'money' },
      { name: 'Number', fieldName: 'number', renderTypeName: 'number' },
      { name: 'Percent', fieldName: 'percent', renderTypeName: 'percent' }
    ]
  }
};

var nonNumericMetadata = {
  data: {
    columns: [
      { name: 'Text', fieldName: 'text', renderTypeName: 'text' }
    ]
  }
};

var validVifAuthoring = {
  vifs: {
    columnChart: { series: [{ dataSource: { measure: { columnName: 'columnName' } } }] }
  }
};

var validVifAuthoringMultiSeries = {
  vifs: {
    columnChart: { series: [
      { dataSource: { measure: { columnName: 'columnName0' } } },
      { dataSource: { measure: { columnName: 'columnName1' } } }
    ] }
  }
};

var validVifAuthoringMultiSeriesMax = {
  vifs: {
    columnChart: { series: [
      { dataSource: { measure: { columnName: 'columnName0' } } },
      { dataSource: { measure: { columnName: 'columnName1' } } },
      { dataSource: { measure: { columnName: 'columnName2' } } },
      { dataSource: { measure: { columnName: 'columnName3' } } },
      { dataSource: { measure: { columnName: 'columnName4' } } },
      { dataSource: { measure: { columnName: 'columnName5' } } },
      { dataSource: { measure: { columnName: 'columnName6' } } },
      { dataSource: { measure: { columnName: 'columnName7' } } },
      { dataSource: { measure: { columnName: 'columnName8' } } },
      { dataSource: { measure: { columnName: 'columnName9' } } },
      { dataSource: { measure: { columnName: 'columnName10' } } },
      { dataSource: { measure: { columnName: 'columnName11' } } }
    ] }
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
        assert.isNull(component);
      });
    });

    describe('with data', function() {
      beforeEach(function() {
        component = renderComponent(MeasureSelector, defaultProps({
          metadata: validMetadata
        }));
      });

      it('renders measure selection', function() {
        assert.isNotNull(component.querySelector('#measure-selection-0'));
        assert.equal(component.querySelectorAll('#measure-selection-0 .picklist-option').length, 4);
      });

      describe('with a measure selected', function() {
        beforeEach(function() {
          component = renderComponent(MeasureSelector, defaultProps({
            metadata: validMetadata,
            vifAuthoring: validVifAuthoring
          }));
        });

        it('renders measure aggregation selection', function() {
          assert.isNotNull(component.querySelector('#measure-aggregation-selection-0'));
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
          assert.isNotNull(component.querySelector('#measure-selection-0.dropdown-disabled'));
        });
      });

      it('does not render the delete measure link', function() {
        assert.isNull(component.querySelector('#measure-delete-link-0'));
      });

      it('renders the "Add Measure" link', function() {
        assert.isNotNull(component.querySelector('#measure-add-measure-link'));
      });

      describe('with multi-series measures', function() {
        beforeEach(function() {
          component = renderComponent(MeasureSelector, defaultProps({
            metadata: validMetadata,
            vifAuthoring: validVifAuthoringMultiSeriesMax
          }));
        });

        it('renders measure selection', function() {
          assert.isNotNull(component.querySelector('#measure-selection-0'));
          assert.isNotNull(component.querySelector('#measure-selection-1'));
          assert.isNotNull(component.querySelector('#measure-selection-2'));
          assert.isNotNull(component.querySelector('#measure-selection-3'));
          assert.isNotNull(component.querySelector('#measure-selection-4'));
          assert.isNotNull(component.querySelector('#measure-selection-5'));
          assert.isNotNull(component.querySelector('#measure-selection-6'));
          assert.isNotNull(component.querySelector('#measure-selection-7'));
          assert.isNotNull(component.querySelector('#measure-selection-8'));
          assert.isNotNull(component.querySelector('#measure-selection-9'));
          assert.isNotNull(component.querySelector('#measure-selection-10'));
          assert.isNotNull(component.querySelector('#measure-selection-11'));
        });

        it('renders measure aggregation selection', function() {
          assert.isNotNull(component.querySelector('#measure-aggregation-selection-0'));
          assert.isNotNull(component.querySelector('#measure-aggregation-selection-1'));
          assert.isNotNull(component.querySelector('#measure-aggregation-selection-2'));
          assert.isNotNull(component.querySelector('#measure-aggregation-selection-3'));
          assert.isNotNull(component.querySelector('#measure-aggregation-selection-4'));
          assert.isNotNull(component.querySelector('#measure-aggregation-selection-5'));
          assert.isNotNull(component.querySelector('#measure-aggregation-selection-6'));
          assert.isNotNull(component.querySelector('#measure-aggregation-selection-7'));
          assert.isNotNull(component.querySelector('#measure-aggregation-selection-8'));
          assert.isNotNull(component.querySelector('#measure-aggregation-selection-9'));
          assert.isNotNull(component.querySelector('#measure-aggregation-selection-10'));
          assert.isNotNull(component.querySelector('#measure-aggregation-selection-11'));
        });

        it('renders measure delete link', function() {
          assert.isNotNull(component.querySelector('#measure-delete-link-0'));
          assert.isNotNull(component.querySelector('#measure-delete-link-1'));
          assert.isNotNull(component.querySelector('#measure-delete-link-2'));
          assert.isNotNull(component.querySelector('#measure-delete-link-3'));
          assert.isNotNull(component.querySelector('#measure-delete-link-4'));
          assert.isNotNull(component.querySelector('#measure-delete-link-5'));
          assert.isNotNull(component.querySelector('#measure-delete-link-6'));
          assert.isNotNull(component.querySelector('#measure-delete-link-7'));
          assert.isNotNull(component.querySelector('#measure-delete-link-8'));
          assert.isNotNull(component.querySelector('#measure-delete-link-9'));
          assert.isNotNull(component.querySelector('#measure-delete-link-10'));
          assert.isNotNull(component.querySelector('#measure-delete-link-11'));
        });

        it('does not render the "Add Measure" link with 12 measures showing', function() {
          assert.isNull(component.querySelector('#measure-add-measure-link'));
        });
      });
    });
  });

  describe('events', function() {
    var props;
    var component;
    var overrides = {
      metadata: validMetadata,
      vifAuthoring: validVifAuthoringMultiSeries,
      onSetMeasureColumn: sinon.stub(),
      onSetMeasureAggregation: sinon.stub(),
      onAddMeasure: sinon.stub(),
      onRemoveMeasure: sinon.stub()
    };

    var emitsDropdownEvent = function(selector, eventName) {
      it(`should emit an ${eventName} event.`, function() {
        var option = component.querySelector(`${selector} .picklist-option`);
        TestUtils.Simulate.click(option);
        sinon.assert.calledOnce(props[eventName]);
      });
    };

    var emitsClickEvent = function(selector, eventName) {
      it(`should emit an ${eventName} event.`, function() {
        var option = component.querySelector(`${selector}`);
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

    describe('when clicking a delete link', function() {
      emitsClickEvent('#measure-delete-link-0', 'onRemoveMeasure');
    });
  });
});
