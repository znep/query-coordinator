const message = window.I18n.unsaved_changes;

export default (store) =>
  (event) => {
    const { isDirty, isEditMenuActive, authoringWorkflow } = store.getState();
    const shouldPreventNavigation = isDirty || isEditMenuActive || authoringWorkflow.isActive;

    if (shouldPreventNavigation) {
      event.returnValue = message;
      return message;
    }
  };
