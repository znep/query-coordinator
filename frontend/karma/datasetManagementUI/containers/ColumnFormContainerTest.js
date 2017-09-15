import PropTypes from 'prop-types';
import React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import { createStore, applyMiddleware } from 'redux';
import reducer from 'reduxStuff/reducers/rootReducer';
import initialState from '../data/initialState';
import thunk from 'redux-thunk';
import ColumnFormConnected from 'containers/ColumnFormContainer';

describe('containers/ColumnFormContainer', () => {
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
        store: PropTypes.object,
        router: PropTypes.object
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
