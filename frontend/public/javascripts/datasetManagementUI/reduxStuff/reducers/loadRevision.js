import dotProp from 'dot-prop-immutable';
import { LOAD_REVISION_SUCCESS } from 'reduxStuff/actions/loadRevision';

const loadRevision = (state, action) => {
  switch (action.type) {
    case LOAD_REVISION_SUCCESS: {
      const stateWithUpdatedRevisions = dotProp.set(
        state,
        `entities.revisions.${action.revision.id}`,
        action.revision
      );

      const stateWithUpdatedTaskSets = dotProp.set(
        stateWithUpdatedRevisions,
        'entities.task_sets',
        action.taskSets
      );

      return dotProp.set(stateWithUpdatedTaskSets, 'ui.forms.datasetForm.errors', action.metadataErrors);
    }

    default:
      return state;
  }
};

export default loadRevision;
