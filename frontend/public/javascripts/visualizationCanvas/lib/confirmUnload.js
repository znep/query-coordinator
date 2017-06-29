import { ModeStates, SaveStates } from './constants';

const message = window.I18n.unsaved_changes;

export default (store) =>
  (event) => {
    const { isDirty, isEditMenuActive, authoringWorkflow, mode, saveState } = store.getState();
    const hasChanged = isDirty || isEditMenuActive || authoringWorkflow.isActive;
    const isViewMode = mode === ModeStates.VIEW;
    const isIdle = saveState === SaveStates.IDLE;

    if (hasChanged && !isViewMode && isIdle) {
      event.returnValue = message;
      return message;
    }
  };
