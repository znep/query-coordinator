import { ModeStates } from './constants';

const message = window.I18n.unsaved_changes;

export default (store) =>
  (event) => {
    const { isDirty, isEditMenuActive, authoringWorkflow, mode } = store.getState();
    const hasChanged = isDirty || isEditMenuActive || authoringWorkflow.isActive;
    const isViewMode = mode === ModeStates.VIEW;

    if (hasChanged && !isViewMode) {
      event.returnValue = message;
      return message;
    }
  };
