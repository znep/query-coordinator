import dotProp from 'dot-prop-immutable';
import { BOOTSTRAP_APP_SUCCESS } from 'actions/bootstrap';

const bootstrapApp = (state, action) => {
  switch (action.type) {
    case BOOTSTRAP_APP_SUCCESS: {
      const stateWithUpdatedViews = dotProp.set(state, 'entities.views', {
        [action.initialView.id]: action.initialView
      });

      const stateWithUpdatedRevisions = dotProp.set(stateWithUpdatedViews, 'entities.revisions', {
        [action.initialRevision.id]: action.initialRevision
      });

      const stateWithUpdatedTaskSets = dotProp.set(
        stateWithUpdatedRevisions,
        'entities.task_sets',
        action.taskSets
      );

      return dotProp.set(stateWithUpdatedTaskSets, 'entities.sources', action.sources);
    }

    default:
      return state;
  }
};

export default bootstrapApp;
