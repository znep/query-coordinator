import visualizationCanvas from 'visualizationCanvas/reducer';
import { ModeStates } from 'visualizationCanvas/lib/constants';

export function getDefaultStore() {
  return redux.createStore(visualizationCanvas);
}

export function getStore(state) {
  const preloadedState = _.merge(
    {
      isDirty: false,
      isEditMenuActive: false,
      isEphemeral: false,
      mode: ModeStates.EDIT
    },
    window.initialState,
    state
  );

  return redux.createStore(visualizationCanvas, preloadedState);
};
