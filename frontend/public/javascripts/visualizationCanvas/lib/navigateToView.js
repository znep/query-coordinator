import { ModeStates } from './constants';
import { enterEditMode, enterViewMode } from '../actions';

export default (store) => {
  return () => {
    const { mode } = store.getState();
    const isEditMode = mode === ModeStates.EDIT;
    const isViewMode = mode === ModeStates.VIEW;

    if (isEditMode) {
      store.dispatch(enterViewMode());
    } else if (isViewMode) {
      store.dispatch(enterEditMode());
    }
  };
};
