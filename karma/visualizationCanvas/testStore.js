import visualizationCanvas from 'reducer';

export function getDefaultStore() {
  return redux.createStore(visualizationCanvas);
}

export function getStore(state) {
  const preloadedState = _.merge({}, window.initialState, state);
  return redux.createStore(visualizationCanvas, preloadedState);
};
