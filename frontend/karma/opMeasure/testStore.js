import opMeasure from 'reducer';

export function getDefaultStore() {
  return redux.createStore(opMeasure);
}

export function getStore(state) {
  const preloadedState = _.merge(
    {
      // TODO: Provide any default state that doesn't come from window.
    },
    window.initialState,
    state
  );

  return redux.createStore(opMeasure, preloadedState);
};
