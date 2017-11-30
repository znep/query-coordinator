import sinon from 'sinon';
import { assert } from 'chai';
import _ from 'lodash';
import React from 'react';
import { shallow } from 'enzyme';
import { ColumnHeader } from 'components/ColumnHeader/ColumnHeader';
import dotProp from 'dot-prop-immutable';

describe('components/ColumnHeader', () => {
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
    canTransform: true,
    columnCount: 1,
    outputSchema: {
      id: 52
    },
    outputColumn: {
      display_name: 'foo',
      transform: {
        output_soql_type: 'text'
      },
      inputColumns: [
        {
          soql_type: 'text'
        }
      ]
    },
    activeApiCallInvolvingThis: false,
    updateColumnType: _.noop,
    dropColumn: _.noop,
    unSetRowIdentifier: _.noop,
    moveLeft: _.noop,
    moveRight: _.noop,
    formatColumn: _.noop,
    validateThenSetRowIdentifier: _.noop,
    showShortcut: _.noop,
    params: testParams
  };

  it('renders without errors', () => {
    const component = shallow(<ColumnHeader {...defaultProps} />);
    assert.isTrue(component.exists());
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


  describe('type list', () => {
    it('renders correct list of types for a text input column', () => {
      const component = shallow(<ColumnHeader {...defaultProps} />);

      const values = component.find('option').map(o => o.prop('value'));

      assert.deepEqual(values, ['calendar_date', 'number', 'text', 'checkbox']);
    });

    it('renders correct list of types for a geo input column', () => {
      const withGeoInput = {
        ...defaultProps,
        outputColumn: {
          display_name: 'foo',
          transform: {
            output_soql_type: 'text'
          },
          inputColumns: [
            {
              soql_type: 'multipolygon'
            }
          ]
        }
      };

      const element = document.createElement('tr');

      const component = shallow(<ColumnHeader {...withGeoInput} />);

      const values = component.find('option').map(o => o.prop('value'));

      assert.deepEqual(values, ['multipolygon', 'text']);
    });

    it('renders correct list of types for a number column', () => {
      const element = document.createElement('tr');
      const withNumInput = {
        ...defaultProps,
        outputColumn: {
          display_name: 'foo',
          transform: {
            output_soql_type: 'text'
          },
          inputColumns: [
            {
              soql_type: 'number'
            }
          ]
        }
      };

      const component = shallow(<ColumnHeader {...withNumInput} />);

      const values = component.find('option').map(o => o.prop('value'));

      assert.deepEqual(values, ['number', 'text', 'checkbox']);
    });
  });

  it('renders a spinner if activeApiCallInvolvingThis is true', () => {
    const props = {
      ...defaultProps,
      outputColumn: {
        inputColumns: [{
          soql_type: 'text'
        }],
        id: 5,
        transform: {
          output_soql_type: 'text'
        }
      },
      activeApiCallInvolvingThis: true,
      updateColumnType: _.noop,
      addColumn: _.noop,
      dropColumn: _.noop
    };

    const component = shallow(<ColumnHeader {...props} />);

    assert.isAtLeast(component.find('.progressSpinner').length, 1);
  });

  it("doesn't render a spinner if there's no api call in progress", () => {
    const props = {
      ...defaultProps,
      outputColumn: {
        inputColumns: [{
          soql_type: 'text'
        }],
        id: 5,
        transform: {
          output_soql_type: 'text'
        }
      },
      updateColumnType: _.noop,
      addColumn: _.noop,
      dropColumn: _.noop
    };
    const element = document.createElement('tr');
    const component = shallow(<ColumnHeader {...props} />);

    assert.equal(component.find('progressSpinner').length, 0);
  });

  it('renders an id icon if this is a row identifier', () => {
    const props = {
      ...defaultProps,
      outputColumn: {
        inputColumns: [{
          soql_type: 'text'
        }],
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
