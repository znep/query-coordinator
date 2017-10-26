import _ from 'lodash';
import React from 'react';
import TestUtils from 'react-dom/test-utils';

import defaultProps from '../defaultProps';
import renderComponent from '../renderComponent';
import { DimensionGroupingColumnNameSelector } from 'common/authoring_workflow/components/DimensionGroupingColumnNameSelector';

import I18n from 'common/i18n';

const metadata = {
  domain: 'test.domain',
  datasetUid: 'xxxx-xxxx',
  data: {
    columns: [
      { name: 'Money', fieldName: 'money', renderTypeName: 'money' },
      { name: 'Number', fieldName: 'number', renderTypeName: 'number' },
      { name: 'Percent', fieldName: 'percent', renderTypeName: 'percent' }
    ]
  }
};

describe('DimensionGroupingColumnNameSelector', () => {
  let component;

  describe('rendering', () => {

    describe('without data', () => {

      beforeEach(() => {
        component = renderComponent(
          DimensionGroupingColumnNameSelector,
          {
            metadata: {
              domain: 'test.domain',
              datasetUid: 'four-four',
              data: { columns: [] }
            }
          }
        );
      });

      it('render an empty list', () => {
        expect(component.querySelectorAll('.picklist-option').length).to.eq(1);
      });

      it('first item is No Grouping', () => {
        const expectedMessage = I18n.t(
          'shared.visualizations.panes.data.fields.dimension_grouping_column_name.no_value'
        );

        expect(component.querySelector('.picklist-option span').innerText).to.eq(expectedMessage);
      });

      it('render with correct subtitle', () => {
        const expectedMessage = I18n.t(
          'shared.visualizations.panes.data.fields.dimension_grouping_column_name.subtitle'
        );

        expect(component.querySelector('.block-label').textContent).
          to.eq(expectedMessage);
      });

      it('render with correct description', () => {
        const expectedMessage = I18n.t(
          'shared.visualizations.panes.data.fields.dimension_grouping_column_name.description'
        );

        expect(component.querySelector('.flyout').textContent).to.eq(expectedMessage);
      });

    });

    describe('with data', () => {

      it('render all columns', () => {
        component = renderComponent(
          DimensionGroupingColumnNameSelector,
          { metadata }
        );

        for (let option of component.querySelectorAll('.picklist-option')) {
          if (option.getAttribute('id') == 'null-0') {
            continue;
          }

          const foundTitle = _.some(metadata.data.columns,
            column => column.name == option.querySelector('span').innerText);

          expect(foundTitle).to.be.true;
        }

      });

      it('does not render selected dimension column', () => {
        const vifAuthoring = {
          authoring: {
            selectedVisualizationType: 'barChart'
          },
          vifs: {
            barChart: { series: [{ dataSource: { dimension: { columnName: metadata.data.columns[1].fieldName } } }] }
          }
        };

        const props = {
          metadata: metadata,
          vifAuthoring: vifAuthoring
        };

        component = renderComponent(
          DimensionGroupingColumnNameSelector,
          props
        );

        const picklistOptions = component.querySelectorAll('.picklist-title');
        const picklistTitles = _.map(
          picklistOptions,
          option => (option.textContent)
        );

        assert.notInclude(picklistTitles, metadata.data.columns[1].name);
        // We add an extra field for "no dimension grouping"
        // which is why we are not comparing to columns.length minus 1
        assert.lengthOf(picklistTitles, metadata.data.columns.length);
      });

    });

  });

  describe('events', () => {
    let component;
    const validVifAuthoring = {
      vifs: {
        columnChart: { series: [{ dataSource: { measure: { columnName: 'columnName' } } }] }
      }
    };
    const props = {
      metadata: metadata,
      vifAuthoring: validVifAuthoring,
      onSelectDimensionGroupingColumnName: sinon.stub()
    };

    const emitsDropdownEvent = (selector, eventName) => {
      it(`should emit an ${eventName} event.`, () => {
        const option = component.querySelector(`${selector} .picklist-option`);
        TestUtils.Simulate.click(option);
        sinon.assert.calledOnce(props[eventName]);
      });
    };

    beforeEach(() => {
      component = renderComponent(
        DimensionGroupingColumnNameSelector,
        props
      );
    });

    describe('when changing the dimension grouping column name dropdown', () => {
      emitsDropdownEvent(
        '#dimension-grouping-column-name-selection',
        'onSelectDimensionGroupingColumnName'
      );
    });
  });
});
