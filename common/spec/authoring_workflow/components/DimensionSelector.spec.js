import React from 'react';
import TestUtils from 'react-dom/test-utils';

import defaultProps from '../defaultProps';
import renderComponent from '../renderComponent';
import { DimensionSelector } from 'common/authoring_workflow/components/DimensionSelector';

describe('DimensionSelector', () => {
  describe('rendering', () => {
    let component;

    describe('without data', () => {
      beforeEach(() => {
        component = renderComponent(DimensionSelector, defaultProps({
          metadata: { data: null }
        }));
      });

      it('does not render a picklist', () => {
        assert.isNull(component);
      });
    });

    describe('with data', () => {
      beforeEach(() => {
        component = renderComponent(DimensionSelector, defaultProps());
      });

      it('renders dimension selection', () => {
        assert.isOk(component.querySelector('#dimension-selection'));
      });
    });
  });

  describe('events', () => {

    describe('onSelectDimension', () => {

      describe('when changing the dimension dropdown', () => {
        const eventName = 'onSelectDimension';
        it(`should emit an ${eventName} event.`, (done) => {
          let props;
          let component;
          const overrides = {
            onSelectDimension: (dim) => {
              const column = props.metadata.data.columns[0];
              // There is a funky mapping between metadata and dimensions.
              assert.equal(dim.title, column.name);
              assert.equal(dim.value, column.fieldName);
              assert.equal(dim.type, column.renderTypeName);
              done();
            },
            onSelectOrderBy: () => {}
          };
          props = defaultProps(overrides);
          component = renderComponent(DimensionSelector, props);

          const option = component.querySelector('#dimension-selection .picklist-option');
          TestUtils.Simulate.click(option);
        });
      });
    });

    describe('onSelectOrderBy', () => {

      describe('when changing the dimension dropdown', () => {
        const eventName = 'onSelectOrderBy';
        it(`should emit an ${eventName} event.`, (done) => {
          let props;
          let component;
          const overrides = {
            onSelectDimension: () => {},
            onSelectOrderBy: (parameter, sort) => {
              // DimensionSelector has hard coded strings for these values.
              assert.equal(parameter, 'measure');
              assert.equal(sort, 'desc');
              done();
            }
          };
          props = defaultProps(overrides);
          component = renderComponent(DimensionSelector, props);

          const option = component.querySelector('#dimension-selection .picklist-option');
          TestUtils.Simulate.click(option);
        });
      });
    });
  });
});
