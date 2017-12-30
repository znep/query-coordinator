import rootReducer from 'reducers';
import { EditTabs, ModeStates } from 'lib/constants';

export function getDefaultStore() {
  return redux.createStore(rootReducer);
}

export function getStore(state) {
  const preloadedState = _.merge(
    {
      view: window.socrata.opMeasure,
      editor: {
        activePanel: EditTabs.GENERAL_INFO,
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
