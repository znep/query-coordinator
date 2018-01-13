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
    columnChart: {
      series: [
        { dataSource: { measure: { columnName: 'columnName' } }, seriesIndex: 0 }
      ]
    }
  }
};

var validVifAuthoringErrorBars = {
  vifs: {
    columnChart: {
      series: [{
        dataSource: {
          measure: {
            columnName: 'columnName'
          }
        },
        seriesIndex: 0,
        errorBars: {
          lowerBoundColumnName: 'columnName',
          upperBoundColumnName: 'columnName'
        }
      }]
    }
  }
};

var validVifAuthoringMultiSeries = {
  vifs: {
    columnChart: {
      series: [
        { dataSource: { measure: { columnName: 'columnName0' } }, seriesIndex: 0 },
        { dataSource: { measure: { columnName: 'columnName1' } }, seriesIndex: 1 }
      ]
    }
  }
};

var validVifAuthoringMultiSeriesMax = {
  vifs: {
    columnChart: {
      series: [
        { dataSource: { measure: { columnName: 'columnName0' } }, seriesIndex: 0 },
        { dataSource: { measure: { columnName: 'columnName1' } }, seriesIndex: 1 },
        { dataSource: { measure: { columnName: 'columnName2' } }, seriesIndex: 2 },
        { dataSource: { measure: { columnName: 'columnName3' } }, seriesIndex: 3 },
        { dataSource: { measure: { columnName: 'columnName4' } }, seriesIndex: 4 },
        { dataSource: { measure: { columnName: 'columnName5' } }, seriesIndex: 5 },
        { dataSource: { measure: { columnName: 'columnName6' } }, seriesIndex: 6 },
        { dataSource: { measure: { columnName: 'columnName7' } }, seriesIndex: 7 },
        { dataSource: { measure: { columnName: 'columnName8' } }, seriesIndex: 8 },
        { dataSource: { measure: { columnName: 'columnName9' } }, seriesIndex: 9 },
        { dataSource: { measure: { columnName: 'columnName10' } }, seriesIndex: 10 },
        { dataSource: { measure: { columnName: 'columnName11' } }, seriesIndex: 11 }
      ]
    }
  }
};

describe('MeasureSelector', () => {
  describe('rendering', () => {
    var component;

    describe('without metadata data', () => {
      beforeEach(() => {
        component = renderComponent(MeasureSelector, defaultProps({
          metadata: { data: null },
          series: validVifAuthoring.vifs.columnChart.series
        }));
      });

      it('does not render a dropdown', () => {
        assert.isNull(component);
      });
    });

    describe('with data', () => {
      beforeEach(() => {
        component = renderComponent(MeasureSelector, defaultProps({
          metadata: validMetadata,
          series: validVifAuthoring.vifs.columnChart.series,
          shouldRenderAddMeasureLink: true
        }));
      });

      it('renders measure selection', () => {
        assert.isNotNull(component.querySelector('#measure-selection-0'));
        assert.equal(component.querySelectorAll('#measure-selection-0 .picklist-option').length, 4);
      });

      describe('with a measure selected', () => {
        beforeEach(() => {
          component = renderComponent(MeasureSelector, defaultProps({
            metadata: validMetadata,
            vifAuthoring: validVifAuthoring,
            series: validVifAuthoring.vifs.columnChart.series
          }));
        });

        it('renders measure aggregation selection', () => {
          assert.isNotNull(component.querySelector('#measure-aggregation-selection-0'));
        });
      });

      describe('when there are error bars', () => {
        beforeEach(() => {
          component = renderComponent(MeasureSelector, defaultProps({
            metadata: validMetadata,
            vifAuthoring: validVifAuthoringErrorBars,
            series: validVifAuthoringErrorBars.vifs.columnChart.series,
            shouldRenderAddMeasureLink: true
          }));
        });

        it('renders a disabled selector', () => {
          const element = component.querySelector('#measure-add-measure-link');
          assert.isNotNull(element); // verify it exists
          assert.isTrue(element.classList.contains('disabled')); // verify it has the 'disabled' class
        });
      });

      describe('when there are error bars and it is a flyout series', () => {
        beforeEach(() => {
          component = renderComponent(MeasureSelector, defaultProps({
            metadata: validMetadata,
            vifAuthoring: validVifAuthoringErrorBars,
            series: validVifAuthoringErrorBars.vifs.columnChart.series,
            shouldRenderAddMeasureLink: true,
            isFlyoutSeries: true
          }));
        });

        it('does not render a disabled selector', () => {
          const element = component.querySelector('#measure-add-measure-link');
          assert.isNotNull(element); // verify it exists
          assert.isFalse(element.classList.contains('disabled')); // verify it does not have the 'disabled' class
        });
      });

      describe('when there are no error bars', () => {
        beforeEach(() => {
          component = renderComponent(MeasureSelector, defaultProps({
            metadata: validMetadata,
            vifAuthoring: validVifAuthoring,
            series: validVifAuthoring.vifs.columnChart.series,
            shouldRenderAddMeasureLink: true
          }));
        });

        it('does not render a disabled selector', () => {
          assert.isNotNull(component.querySelector('#measure-add-measure-link'));
          assert.isNull(component.querySelector('#measure-add-measure-link.disabled'));

          const element = component.querySelector('#measure-add-measure-link');
          assert.isNotNull(element); // verify it exists
          assert.isFalse(element.classList.contains('disabled')); // verify it has the 'disabled' class
        });
      });

      describe('when there are no numeric columns', () => {
        beforeEach(() => {
          component = renderComponent(MeasureSelector, defaultProps({
            metadata: nonNumericMetadata,
            vifAuthoring: validVifAuthoring,
            series: validVifAuthoring.vifs.columnChart.series
          }));
        });

        it('renders a disabled selector', () => {
          assert.isNotNull(component.querySelector('#measure-selection-0.dropdown-disabled'));
        });
      });

      it('does not render the delete measure link', () => {
        assert.isNull(component.querySelector('#measure-delete-link-0'));
      });

      it('renders the "Add Measure" link', () => {
        assert.isNotNull(component.querySelector('#measure-add-measure-link'));
      });

      describe('with multi-series measures', () => {
        beforeEach(() => {
          component = renderComponent(MeasureSelector, defaultProps({
            metadata: validMetadata,
            vifAuthoring: validVifAuthoringMultiSeriesMax,
            series: validVifAuthoringMultiSeriesMax.vifs.columnChart.series,
            shouldRenderDeleteMeasureLink: true
          }));
        });

        it('renders measure selection', () => {
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

        it('renders measure aggregation selection', () => {
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

        it('renders measure delete link', () => {
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

        it('does not render the "Add Measure" link with 12 measures showing', () => {
          assert.isNull(component.querySelector('#measure-add-measure-link'));
        });
      });
    });

    describe('with data and with flyout series variant', () => {
      beforeEach(() => {
        component = renderComponent(MeasureSelector, defaultProps({
          isFlyoutSeries: true,
          metadata: validMetadata,
          series: validVifAuthoring.vifs.columnChart.series,
          shouldRenderAddMeasureLink: true
        }));
      });

      it('renders the "Add Flyout Value" link', () => {
        assert.isNotNull(component.querySelector('#measure-add-measure-link'));
        assert.equal(component.querySelector('#measure-add-measure-link').textContent, 'Add Flyout Value');
      });
    });
  });

  describe('events', () => {
    var props;
    var component;
    var overrides = {
      metadata: validMetadata,
      vifAuthoring: validVifAuthoringMultiSeries,
      onSetMeasureColumn: sinon.stub(),
      onSetMeasureAggregation: sinon.stub(),
      onAddMeasure: sinon.stub(),
      onRemoveSeries: sinon.stub(),
      series: validVifAuthoringMultiSeries.vifs.columnChart.series,
      shouldRenderDeleteMeasureLink: true
    };

    var emitsDropdownEvent = function(selector, eventName) {
      it(`should emit an ${eventName} event.`, () => {
        var option = component.querySelector(`${selector} .picklist-option`);
        TestUtils.Simulate.click(option);
        sinon.assert.calledOnce(props[eventName]);
      });
    };

    var emitsClickEvent = function(selector, eventName) {
      it(`should emit an ${eventName} event.`, () => {
        var option = component.querySelector(`${selector}`);
        TestUtils.Simulate.click(option);
        sinon.assert.calledOnce(props[eventName]);
      });
    };

    beforeEach(() => {
      props = defaultProps(overrides);
      component = renderComponent(MeasureSelector, props);
    });

    describe('when changing the measure dropdown', () => {
      emitsDropdownEvent('#measure-selection-0', 'onSetMeasureColumn');
    });

    describe('when changing the measure aggregation dropdown', () => {
      emitsDropdownEvent('#measure-aggregation-selection-0', 'onSetMeasureAggregation');
    });

    describe('when clicking a delete link', () => {
      emitsClickEvent('#measure-delete-link-0', 'onRemoveSeries');
    });
  });
});
