import { combineReducers } from 'redux';
import reduceReducers from 'reduce-reducers';
import dotProp from 'dot-prop-immutable';

import notifications from 'reducers/notifications';
import routing from 'reducers/routing';
import flashMessage from 'reducers/flashMessage';
import modal from 'reducers/modal';
import channels from 'reducers/channels';
import apiCalls from 'reducers/apiCalls';

const entityInitialState = {
  views: {},
  revisions: {},
  uploads: {},
  input_schemas: {},
  output_schemas: {},
  output_columns: {},
  output_schema_columns: {},
  transforms: {},
  task_sets: {},
  email_interests: {},
  row_errors: {},
  col_data: {}
};

const entities = (state = entityInitialState) => {
  return state;
};

const ui = combineReducers({
  flashMessage,
  routing,
  notifications,
  modal,
  channels,
  apiCalls
});

const combined = combineReducers({
  entities,
  ui
});

const bootstrapApp = (state, action) => {
  switch (action.type) {
    case 'BOOTSTRAP_APP': {
      const stateWithUpdatedViews = dotProp.set(state, 'entities.views', {
        [action.initialView.id]: action.initialView
      });

      const stateWithUpdatedRevisions = dotProp.set(stateWithUpdatedViews, 'entities.revisions', {
        [action.initialRevision.id]: action.initialRevision
      });

      return dotProp.set(stateWithUpdatedRevisions, 'entities.task_sets', action.taskSets);
    }

    default:
      return state;
  }
};

const createUpload = (state, action) => {
  switch (action.type) {
    case 'CREATE_UPLOAD_SUCCESS':
      return dotProp.set(state, 'entities.uploads', {
        id: action.id,
        created_by: action.created_by,
        created_at: action.created_at,
        filename: action.filename
      });

    default:
      return state;
  }
};

export default reduceReducers(combined, createUpload, bootstrapApp);
