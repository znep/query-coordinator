import rootReducer from 'reducers';
import { ModeStates } from 'lib/constants';

export function getDefaultStore() {
  return redux.createStore(rootReducer);
}

export function getStore(state) {
  const preloadedState = _.merge(
    {
      view: window.initialState,
      editor: {
        isEditing: true,
        measure: window.initialState.measure
      }
    },
    state
  );

  return redux.createStore(rootReducer, preloadedState);
};
