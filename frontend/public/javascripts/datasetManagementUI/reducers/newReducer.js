import { combineReducers } from 'redux';
import reduceReducers from 'reduce-reducers';
import dotProp from 'dot-prop-immutable';

import notifications from 'reducers/notifications';
import routing from 'reducers/routing';
import flashMessage from 'reducers/flashMessage';
import modal from 'reducers/modal';
import channels from 'reducers/channels';
import apiCalls from 'reducers/apiCalls';

const views = (state = {}) => state;
const revisions = (state = {}) => state;
const uploads = (state = {}) => state;

const inputSchemas = (state = {}, action) => {
  switch (action.type) {
    case 'EDIT_INPUT_SCHEMA':
      return {
        ...state,
        [action.id]: {
          ...state[action.id],
          ...action.payload
        }
      };
    default:
      return state;
  }
};

const outputSchemas = (state = {}, action) => {
  switch (action.type) {
    case 'EDIT_OUTPUT_SCHEMA':
      return {
        ...state,
        [action.id]: {
          ...state[action.id],
          ...action.payload
        }
      };
    default:
      return state;
  }
};

const outputColumns = (state = {}) => state;
const outputSchemaColumns = (state = {}) => state;

const transforms = (state = {}, action) => {
  switch (action.type) {
    case 'EDIT_TRANSFORM':
      return {
        ...state,
        [action.id]: {
          ...state[action.id],
          ...action.payload
        }
      };
    default:
      return state;
  }
};

const taskSets = (state = {}) => state;
const emailInterests = (state = {}) => state;
const rowErrors = (state = {}) => state;
const colData = (state = {}) => state;

const entities = combineReducers({
  views,
  revisions,
  uploads,
  input_schemas: inputSchemas,
  output_schemas: outputSchemas,
  output_columns: outputColumns,
  output_schema_columns: outputSchemaColumns,
  transforms: transforms,
  task_sets: taskSets,
  email_interests: emailInterests,
  row_errors: rowErrors,
  col_data: colData
});

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
      return dotProp.set(state, 'entities.uploads', existingRecords => ({
        ...existingRecords,
        [action.id]: {
          id: action.id,
          created_by: action.created_by,
          created_at: action.created_at,
          filename: action.filename
        }
      }));

    default:
      return state;
  }
};

const uploadFile = (state, action) => {
  switch (action.type) {
    case 'UPLOAD_FILE_SUCCESS': {
      const stateWithUpdatedUploads = dotProp.set(state, `entities.uploads.${action.uploadId}`, record => ({
        ...record,
        finished_at: action.finishedAt
      }));

      return dotProp.set(
        stateWithUpdatedUploads,
        `entities.input_schemas.${action.inputSchemaId}`,
        record => ({
          ...record,
          total_rows: action.totalRows
        })
      );
    }
    default:
      return state;
  }
};

const createTable = (state, action) => {
  switch (action.type) {
    case 'CREATE_TABLE':
      return dotProp.set(state, 'entities', existingRecords => ({
        ...existingRecords,
        [action.tableName]: {}
      }));
    default:
      return state;
  }
};

const pollForOutputSchema = (state, action) => {
  switch (action.type) {
    case 'POLL_FOR_OUTPUT_SCHEMA_SUCCESS': {
      const stateWithUpdatedOutputSchemas = dotProp.set(
        state,
        'entities.output_schemas',
        existingRecords => ({
          ...existingRecords,
          [action.outputSchema.id]: action.outputSchema
        })
      );

      const stateWithUpdatedTransforms = dotProp.set(
        stateWithUpdatedOutputSchemas,
        'entities.transforms',
        existingRecords => ({
          ...existingRecords,
          ...action.transforms
        })
      );

      const stateWithUpdatedOutputColumns = dotProp.set(
        stateWithUpdatedTransforms,
        'entities.output_columns',
        existingRecords => ({
          ...existingRecords,
          ...action.outputColumns
        })
      );

      return dotProp.set(
        stateWithUpdatedOutputColumns,
        'entities.output_schema_columns',
        existingRecords => ({
          ...existingRecords,
          ...action.outputSchemaColumns
        })
      );
    }

    default:
      return state;
  }
};

export default reduceReducers(
  combined,
  createUpload,
  bootstrapApp,
  uploadFile,
  pollForOutputSchema,
  createTable
);
