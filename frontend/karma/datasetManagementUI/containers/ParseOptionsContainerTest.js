import PropTypes from 'prop-types';
import React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import { createStore, applyMiddleware } from 'redux';
import reducer from 'reduxStuff/reducers/rootReducer';
import initialState from '../data/initialState';
import thunk from 'redux-thunk';
import ParseOptionsContainer from 'containers/ParseOptionsContainer';

describe('containers/ParseOptionsContainer', () => {
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

  it('puts its local state in the store', () => {
    const component = mount(<ParseOptionsContainer params={testParams} />, {
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
      .find('#header_count')
      .first()
      .simulate('change', { target: { value: '2' } });

    assert.equal(
      testStore.getState().ui.forms.parseOptionsForm.state.parseOptions.header_count,
      2
    );

    component
      .find('#header_count')
      .first()
      .simulate('change', { target: { value: 'foo' } });

    assert.equal(
      testStore.getState().ui.forms.parseOptionsForm.state.errors.header_count.message,
      'Must be an integer'
    );
  });
});
