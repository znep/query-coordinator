import { expect, assert } from 'chai';
import RowDetails from 'components/RowDetails';
import rootReducer from 'reducers/rootReducer';
import { applyMiddleware, createStore } from 'redux';
import configureStore from 'redux-mock-store';
import { bootstrapApp } from 'actions/bootstrap';
import thunk from 'redux-thunk';
import wsmock from '../testHelpers/mockSocket';
import dotProp from 'dot-prop-immutable';

describe('RowDetails', () => {
  let unmockWS;
  let store;

  before(() => {
    unmockWS = wsmock();
  });

  after(() => {
    unmockWS.stop();
  });

  beforeEach(() => {
    store = createStore(rootReducer, applyMiddleware(thunk));
    store.dispatch(
      bootstrapApp(
        window.initialState.view,
        window.initialState.revision,
        window.initialState.customMetadataFieldsets
      )
    );
  });

  it('renders when there is no output schema', () => {
    const stateWithoutOS = dotProp.set(
      store.getState(),
      'entities.output_schemas',
      {}
    );
    const newStore = createStore(
      rootReducer,
      stateWithoutOS,
      applyMiddleware(thunk)
    );
    const element = renderComponentWithStore(RowDetails, {}, newStore);
    assert.isNotNull(element);
  });

  it('renders when there is an output schema, but transforms have no rows yet', () => {
    const transforms = store.getState().entities.transforms;

    const updatedTransforms = Object.keys(transforms).reduce(
      (acc, tid) => ({
        ...acc,
        [tid]: {
          id: tid,
          output_soql_type: transforms[tid].output_soql_type
        }
      }),
      {}
    );

    const stateWithUpdatedTransforms = dotProp.set(
      store.getState(),
      'entities.transforms',
      updatedTransforms
    );

    const newStore = createStore(
      rootReducer,
      stateWithUpdatedTransforms,
      applyMiddleware(thunk)
    );

    const element = renderComponentWithStore(RowDetails, {}, newStore);

    assert.isNotNull(element);
  });
});
