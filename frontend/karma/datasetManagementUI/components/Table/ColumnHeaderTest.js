import sinon from 'sinon';
import { assert } from 'chai';
import _ from 'lodash';
import React from 'react';
import { shallow } from 'enzyme';
import { ColumnHeader } from 'components/Table/ColumnHeader';
import dotProp from 'dot-prop-immutable';

describe('components/Table/ColumnHeader', () => {
  const testParams = {
    category: 'dataset',
    name: 'dfsdfdsf',
    fourfour: 'kg5j-unyr',
    revisionSeq: '0',
    sourceId: '115',
    inputSchemaId: '98',
    outputSchemaId: '52'
  };

  const defaultProps = {
    outputSchema: {
      id: 52
    },
    outputColumn: {
      display_name: 'foo',
      transform: {
        output_soql_type: 'text'
      },
      inputColumn: {
        soql_type: 'text'
      }
    },
    activeApiCallInvolvingThis: false,
    updateColumnType: _.noop,
    addColumn: _.noop,
    dropColumn: _.noop,
    validateThenSetRowIdentifier: _.noop,
    params: testParams
  };

  it('renders without errors', () => {
    const component = shallow(<ColumnHeader {...defaultProps} />);
    assert.isFalse(component.isEmpty());
  });

  it('handles column type changing', () => {
    const spy = sinon.spy();

    const props = {
      ...defaultProps,
      updateColumnType: spy,
      addColumn: _.noop,
      dropColumn: _.noop
    };

    const component = shallow(<ColumnHeader {...props} />);

    const select = component.find('select').first();

    select.simulate('change', { target: { value: 'number' } });

    assert.deepEqual(spy.args[0], [
      defaultProps.outputSchema,
      defaultProps.outputColumn,
      'number',
      defaultProps.params
    ]);
  });

  it('renders an Ignore Column button when not ignored', () => {
    const props = {
      ...defaultProps,
      updateColumnType: _.noop,
      addColumn: _.noop,
      dropColumn: _.noop
    };

    const component = shallow(<ColumnHeader {...props} />);

    const dropdown = component.find('Dropdown').dive().find('Picklist').dive();

    assert.isAtLeast(dropdown.find('.socrata-icon-eye-blocked').length, 1);

    assert.equal(dropdown.find('.socrata-icon-add').length, 0);
  });

  it('renders an Add Column button when ignored', () => {
    const props = {
      ...defaultProps,
      outputColumn: {
        ...defaultProps.outputColumn,
        ignored: true
      },
      updateColumnType: _.noop,
      addColumn: _.noop,
      dropColumn: _.noop
    };

    const component = shallow(<ColumnHeader {...props} />);

    const dropdown = component.find('Dropdown').dive().find('Picklist').dive();

    assert.equal(dropdown.find('.socrata-icon-eye-blocked').length, 0);

    assert.equal(dropdown.find('.socrata-icon-plus3').length, 1);
  });

  // testing fix for EN-12896
  it('handles column type changing after output schema changes', () => {
    const spy = sinon.spy();

    const props = {
      ...defaultProps,
      updateColumnType: spy,
      addColumn: _.noop,
      dropColumn: _.noop
    };

    const newProps = {
      outputSchema: {
        id: 53
      },
      params: {
        ...testParams,
        outputSchemaId: '53'
      }
    };

    const component = shallow(<ColumnHeader {...props} />);

    component.setProps(newProps);

    const select = component.find('select').first();

    select.simulate('change', { target: { value: 'number' } });

    assert.deepEqual(spy.args[0], [
      newProps.outputSchema,
      defaultProps.outputColumn,
      'number',
      newProps.params
    ]);
  });

  describe('type list', () => {
    it('renders correct list of types for a text input column', () => {
      const component = shallow(<ColumnHeader {...defaultProps} />);

      const values = component.find('option').map(o => o.prop('value'));

      assert.deepEqual(values, ['calendar_date', 'number', 'text', 'checkbox']);
    });

    it('renders correct list of types for a geo input column', () => {
      const withGeoInput = dotProp.set(
        defaultProps,
        'outputColumn.inputColumn.soql_type',
        'multipolygon'
      );

      const component = shallow(<ColumnHeader {...withGeoInput} />);

      const values = component.find('option').map(o => o.prop('value'));

      assert.deepEqual(values, ['multipolygon', 'text']);
    });

    it('renders correct list of types for a number column', () => {
      const withNumInput = dotProp.set(
        defaultProps,
        'outputColumn.inputColumn.soql_type',
        'number'
      );

      const component = shallow(<ColumnHeader {...withNumInput} />);

      const values = component.find('option').map(o => o.prop('value'));

      assert.deepEqual(values, ['number', 'text', 'checkbox']);
    });
  });

  it('renders a spinner if activeApiCallInvolvingThis is true', () => {
    const props = {
      ...defaultProps,
      activeApiCallInvolvingThis: true
    };

    const component = shallow(<ColumnHeader {...props} />);

    assert.isAtLeast(component.find('.progressSpinner').length, 1);
  });

  it('does not render a spinner if activeApiCallInvolvingThis is false', () => {
    const component = shallow(<ColumnHeader {...defaultProps} />);

    assert.equal(component.find('progressSpinner').length, 0);
  });

  it('renders an id icon if this is a row identifier', () => {
    const props = {
      ...defaultProps,
      outputColumn: {
        inputColumn: {
          soql_type: 'text'
        },
        transform: {
          output_soql_type: 'text'
        },
        is_primary_key: true
      },
      updateColumnType: _.noop,
      addColumn: _.noop,
      dropColumn: _.noop
    };

    const component = shallow(<ColumnHeader {...props} />);

    assert.isAtLeast(component.find('.socrata-icon-id').length, 1);
  });
});
