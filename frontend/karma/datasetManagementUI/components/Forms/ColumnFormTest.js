import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import React from 'react';
import { createStore, applyMiddleware } from 'redux';
import reducer from 'reducers/rootReducer';
import initialState from '../../data/initialState';
import thunk from 'redux-thunk';
import * as Types from 'models/forms';
import ColumnFormConnected, { ColumnForm } from 'components/Forms/ColumnForm';

describe('components/Forms/ColumnForm', () => {
  const testStore = createStore(reducer, initialState, applyMiddleware(thunk));

  const testParams = {
    category: 'dataset',
    name: 'dfsdfdsf',
    fourfour: 'kg5j-unyr',
    revisionSeq: '0',
    sourceId: '115',
    inputSchemaId: '98',
    outputSchemaId: '144'
  };

  const defaultProps = {
    setErrors: () => {},
    outputSchemaId: 3,
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

  it("syncs it's local state to store", () => {
    // prob better to test this in the ColumnField component since that is where
    // this syncing function is defined, but figured I'd leave this hear as an
    // example in case we need to test something like this later.
    const component = mount(<ColumnFormConnected outputSchemaId={144} />, {
      context: {
        store: testStore,
        router: {
          params: testParams,
          push: () => {},
          replace: () => {},
          go: () => {},
          goBack: () => {},
          goForward: () => {},
          createHref: () => {},
          createPath: () => {},
          setRouteLeaveHook: () => {},
          isActive: () => {}
        }
      },
      childContextTypes: {
        store: React.PropTypes.object
      }
    });

    component
      .find('#display-name-1945')
      .first()
      .simulate('change', { target: { value: 'hey' } });

    assert.equal(
      testStore.getState().entities.output_columns['1945'].display_name,
      'hey'
    );
  });
});
