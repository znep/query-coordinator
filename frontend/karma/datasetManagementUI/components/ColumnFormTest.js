import { assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import * as Types from 'models/forms';
import ColumnForm from 'components/ColumnForm/ColumnForm';

describe('components/ColumnForm', () => {
  const defaultProps = {
    setErrors: () => {},
    outputSchemaId: 3,
    errors: [],
    rows: [
      [
        {
          data: {
            name: 'display-name-3200',
            label: 'Column Name',
            value: 'Type',
            isPrivate: false,
            isRequired: false,
            placeholder: null,
            isCustom: false
          }
        },
        {
          data: {
            name: 'description-3200',
            label: 'Column Description',
            value: '',
            isPrivate: false,
            isRequired: false,
            placeholder: null,
            isCustom: false
          }
        },
        {
          data: {
            name: 'field-name-3200',
            label: 'API Field Name',
            value: 'ok',
            isPrivate: false,
            isRequired: false,
            placeholder: null,
            isCustom: false
          }
        }
      ],
      [
        {
          data: {
            name: 'display-name-3188',
            label: 'Column Name',
            value: 'Found Location',
            isPrivate: false,
            isRequired: false,
            placeholder: null,
            isCustom: false
          }
        },
        {
          data: {
            name: 'description-3188',
            label: 'Column Description',
            value: '',
            isPrivate: false,
            isRequired: false,
            placeholder: null,
            isCustom: false
          }
        },
        {
          data: {
            name: 'field-name-3188',
            label: 'API Field Name',
            value: 'found_location',
            isPrivate: false,
            isRequired: false,
            placeholder: null,
            isCustom: false
          }
        }
      ],
      [
        {
          data: {
            name: 'display-name-3198',
            label: 'Column Name',
            value: 'okkj',
            isPrivate: false,
            isRequired: false,
            placeholder: null,
            isCustom: false
          }
        },
        {
          data: {
            name: 'description-3198',
            label: 'Column Description',
            value: '',
            isPrivate: false,
            isRequired: false,
            placeholder: null,
            isCustom: false
          }
        },
        {
          data: {
            name: 'field-name-3198',
            label: 'API Field Name',
            value: 'at_aac',
            isPrivate: false,
            isRequired: false,
            placeholder: null,
            isCustom: false
          }
        }
      ]
    ]
  };

  it('renders correctly', () => {
    const component = shallow(<ColumnForm {...defaultProps} />);

    assert.equal(component.find('form').length, 1);
    assert.equal(component.find('Fieldset').length, 1);
    assert.equal(component.find('.row').length, 3);
    assert.equal(component.find('.row').children().length, 9);
    assert.equal(
      component
        .find('.row')
        .children()
        .map(f => Types.Field.Text.is(f.prop('field'))).length,
      9
    );
  });
});
