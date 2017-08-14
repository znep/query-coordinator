import dotProp from 'dot-prop-immutable';
import { POLL_FOR_TASK_SET_PROGRESS_SUCCESS } from 'reduxStuff/actions/applyRevision';

const applyRevision = (state, action) => {
  switch (action.type) {
    case POLL_FOR_TASK_SET_PROGRESS_SUCCESS: {
      const stateWithUpdatedRevision = dotProp.set(
        state,
        `entities.revisions.${action.revision.id}`,
        record => ({
          ...record,
          ...action.revision
        })
      );

      return dotProp.set(stateWithUpdatedRevision, `entities.task_sets.${action.taskSet.id}`, record => ({
        ...record,
        ...action.taskSet
      }));
    }

    default:
      return state;
  }
};

export default applyRevision;
