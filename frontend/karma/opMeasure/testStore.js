import rootReducer from 'reducers';
import { ModeStates } from 'lib/constants';

export function getDefaultStore() {
  return redux.createStore(rootReducer);
}

export function getStore(state) {
  const preloadedState = _.merge(
    {
      view: window.socrata.opMeasure,
      editor: {
        isEditing: true,
        coreView: window.socrata.opMeasure.coreView,
        measure: window.socrata.opMeasure.measure,
        pristineMeasure: window.socrata.opMeasure.measure,
        pristineCoreView: window.socrata.opMeasure.coreView,
        validationErrors: {}
      }
    },
    state
  );

  return redux.createStore(rootReducer, preloadedState);
};
