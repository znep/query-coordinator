import { expect, assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import { createStore, applyMiddleware } from 'redux';
import TestUtils from 'react-addons-test-utils';
import reducer from 'reducers/rootReducer';
import initialState from '../../data/initialState';
import thunk from 'redux-thunk';

import ColumnFormConnected, { ColumnForm } from 'components/Forms/ColumnForm';

describe('components/ManageMetadata/ColumnForm', () => {
  const store = createStore(reducer, initialState, applyMiddleware(thunk));

  const defaultProps = {
    currentColumns: [
      {
        position: 0,
        is_primary_key: false,
        id: 1945,
        field_name: 'id',
        display_name: 'ID',
        description: '',
        transform_id: 1939,
        transform: {
          transform_input_columns: [
            {
              input_column_id: 1907
            }
          ],
          transform_expr: 'to_number(`id`)',
          output_soql_type: 'number',
          id: 1939,
          failed_at: null,
          completed_at: '2017-06-14T00:37:21',
          attempts: 0,
          error_indices: [],
          contiguous_rows_processed: 9
        }
      },
      {
        position: 1,
        is_primary_key: false,
        id: 1946,
        field_name: 'case_number',
        display_name: 'Case Number',
        description: '',
        transform_id: 1940,
        transform: {
          transform_input_columns: [
            {
              input_column_id: 1908
            }
          ],
          transform_expr: '`case_number`',
          output_soql_type: 'text',
          id: 1940,
          failed_at: null,
          completed_at: '2017-06-14T00:37:21',
          attempts: 0,
          error_indices: [],
          contiguous_rows_processed: 9
        }
      }
    ],
    fourfour: '3kt9-pmvq',
    syncToStore: () => {}
  };

  it('renders correctly', () => {
    const component = shallow(<ColumnForm {...defaultProps} />);
    expect(component.find('form')).to.have.length(1);
    expect(component.find('Fieldset')).to.have.length(1);
    expect(component.find('.row')).to.have.length(2);
    expect(component.find('.row').children()).to.have.length(6);
    expect(
      component
        .find('.row')
        .children()
        .map(field => field.prop('type'))
        .filter(type => type === 'text')
    ).to.have.length(6);
  });

  it("syncs it's local state to store", () => {
    const component = renderComponentWithStore(ColumnFormConnected, {}, store);
    const inputField = component.querySelector('#display-name-1945');
    inputField.value = 'testing!!!';
    TestUtils.Simulate.change(inputField, { target: inputField });
    expect(
      store.getState().entities.views['kg5j-unyr'].colFormModel[
        'display-name-1945'
      ]
    ).to.eq('testing!!!');
  });
});
