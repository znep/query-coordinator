import { expect, assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import { createStore, applyMiddleware } from 'redux';
import TestUtils from 'react-addons-test-utils';
import reducer from 'reducers/rootReducer';
import initialState from '../../data/initialState';
import thunk from 'redux-thunk';
import * as Types from 'models/forms';

import ColumnFormConnected, { ColumnForm } from 'components/Forms/ColumnForm';

describe('components/ManageMetadata/ColumnForm', () => {
  const store = createStore(reducer, initialState, applyMiddleware(thunk));

  const defaultProps = {
    setErrors: () => {},
    errors: [],
    rows: [
      [
        {
          name: 'display-name-3200',
          label: 'Column Name',
          value: 'Type',
          isPrivate: false,
          isRequired: false,
          placeholder: null,
          isCustom: false
        },
        {
          name: 'description-3200',
          label: 'Column Description',
          value: '',
          isPrivate: false,
          isRequired: false,
          placeholder: null,
          isCustom: false
        },
        {
          name: 'field-name-3200',
          label: 'API Field Name',
          value: 'ok',
          isPrivate: false,
          isRequired: false,
          placeholder: null,
          isCustom: false
        }
      ],
      [
        {
          name: 'display-name-3188',
          label: 'Column Name',
          value: 'Found Location',
          isPrivate: false,
          isRequired: false,
          placeholder: null,
          isCustom: false
        },
        {
          name: 'description-3188',
          label: 'Column Description',
          value: '',
          isPrivate: false,
          isRequired: false,
          placeholder: null,
          isCustom: false
        },
        {
          name: 'field-name-3188',
          label: 'API Field Name',
          value: 'found_location',
          isPrivate: false,
          isRequired: false,
          placeholder: null,
          isCustom: false
        }
      ],
      [
        {
          name: 'display-name-3198',
          label: 'Column Name',
          value: 'okkj',
          isPrivate: false,
          isRequired: false,
          placeholder: null,
          isCustom: false
        },
        {
          name: 'description-3198',
          label: 'Column Description',
          value: '',
          isPrivate: false,
          isRequired: false,
          placeholder: null,
          isCustom: false
        },
        {
          name: 'field-name-3198',
          label: 'API Field Name',
          value: 'at_aac',
          isPrivate: false,
          isRequired: false,
          placeholder: null,
          isCustom: false
        }
      ]
    ]
  };

  it('renders correctly', () => {
    const component = shallow(<ColumnForm {...defaultProps} />);
    expect(component.find('form')).to.have.length(1);
    expect(component.find('Fieldset')).to.have.length(1);
    expect(component.find('.row')).to.have.length(3);
    expect(component.find('.row').children()).to.have.length(9);
    expect(
      component
        .find('.row')
        .children()
        .map(f => Types.Field.Text.is(f.prop('field')))
    ).to.have.length(9);
  });

  it("syncs it's local state to store", () => {
    const component = renderComponentWithStore(ColumnFormConnected, {}, store);
    const inputField = component.querySelector('#display-name-1945');
    inputField.value = 'testing!!!';
    TestUtils.Simulate.change(inputField, { target: inputField });
    expect(store.getState().entities.output_columns['1945'].display_name).to.eq(
      'testing!!!'
    );
  });
});
