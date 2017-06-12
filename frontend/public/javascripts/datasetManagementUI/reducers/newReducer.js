import _ from 'lodash';
import { combineReducers } from 'redux';
import reduceReducers from 'reduce-reducers';
import dotProp from 'dot-prop-immutable';

import notifications from 'reducers/notifications';
import routing from 'reducers/routing';
import flashMessage from 'reducers/flashMessage';
import modal from 'reducers/modal';
import channels from 'reducers/channels';
import apiCalls from 'reducers/apiCalls';

import {
  INSERT_INPUT_SCHEMA,
  POLL_FOR_OUTPUT_SCHEMA_SUCCESS,
  UPLOAD_FILE_SUCCESS,
  CREATE_UPLOAD_SUCCESS,
  UPDATE_PROGRESS
} from 'actions/manageUploads';

import {
  LOAD_ROW_ERRORS_SUCCESS,
  LOAD_COLUMN_ERRORS_SUCCESS,
  LOAD_NORMAL_PREVIEW_SUCCESS
} from 'actions/loadData';

import { EDIT_OUTPUT_SCHEMA } from 'actions/outputSchemas';
import { EDIT_TRANSFORM } from 'actions/transforms';
import { EDIT_INPUT_SCHEMA } from 'actions/inputSchemas';
import { BOOTSTRAP_APP_SUCCESS } from 'actions/bootstrap';
import { EDIT_VIEW } from 'actions/views';

const views = (state = {}, action) => {
  switch (action.type) {
    case EDIT_VIEW: {
      return dotProp.set(state, action.id, record => ({
        ...record,
        ...action.payload
      }));
    }
    default:
      return state;
  }
};
const revisions = (state = {}) => state;

const uploads = (state = {}, action) => {
  switch (action.type) {
    case UPDATE_PROGRESS:
      return dotProp.set(state, action.uploadId, record => ({
        ...record,
        percentCompleted: action.percentCompleted
      }));
    default:
      return state;
  }
};

const inputSchemas = (state = {}, action) => {
  switch (action.type) {
    case EDIT_INPUT_SCHEMA:
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

const inputColumns = (state = {}) => state;

const outputSchemas = (state = {}, action) => {
  switch (action.type) {
    case EDIT_OUTPUT_SCHEMA:
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
    case EDIT_TRANSFORM:
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
  input_columns: inputColumns,
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

      return dotProp.set(stateWithUpdatedTaskSets, 'entities.uploads', action.uploads);
    }

    default:
      return state;
  }
};

const createUpload = (state, action) => {
  switch (action.type) {
    case CREATE_UPLOAD_SUCCESS:
      return dotProp.set(state, 'entities.uploads', existingRecords => ({
        ...existingRecords,
        [action.id]: {
          id: action.id,
          created_by: action.created_by,
          created_at: action.created_at,
          filename: action.filename,
          percentCompleted: 0
        }
      }));

    default:
      return state;
  }
};

const uploadFile = (state, action) => {
  switch (action.type) {
    case UPLOAD_FILE_SUCCESS: {
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

const pollForOutputSchema = (state, action) => {
  switch (action.type) {
    case POLL_FOR_OUTPUT_SCHEMA_SUCCESS: {
      const stateWithUpdatedOutputSchemas = dotProp.set(
        state,
        'entities.output_schemas',
        existingRecords => ({
          ...existingRecords,
          [action.outputSchema.id]: action.outputSchema
        })
      );

      let stateWithUpdatedTransforms = stateWithUpdatedOutputSchemas;

      action.transformUpdates.forEach(update => {
        stateWithUpdatedTransforms = dotProp.set(
          stateWithUpdatedTransforms,
          `entities.transforms.${update.id}`,
          record => ({
            ...record,
            ...update
          })
        );
      });

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

const loadData = (state, action) => {
  switch (action.type) {
    case LOAD_NORMAL_PREVIEW_SUCCESS: {
      const stateWithUpdatedColData = dotProp.set(state, 'entities.col_data', existingRecords => ({
        ...existingRecords,
        ...action.colData
      }));

      return dotProp.set(stateWithUpdatedColData, 'entities.row_errors', existingRecords => ({
        ...existingRecords,
        ...action.rowErrors
      }));
    }

    case LOAD_COLUMN_ERRORS_SUCCESS: {
      debugger;
      const stateWithUpdatedColData = _.reduce(
        action.colData,
        (result, dataForTransform, transformId) => (
          dotProp.set(result, ['entities', 'col_data', transformId], (existingDataForTransform) => ({
            ...existingDataForTransform,
            ...dataForTransform.record
          }))
        ),
        state
      );

      return action.transformUpdates.reduce((stateWithUpdatedTransforms, update) => (
        dotProp.set(
          stateWithUpdatedTransforms,
          `entities.transforms.${update.id}`,
          record => ({
            ...record,
            ...update
          })
        )
      ), stateWithUpdatedColData);
    }

    case LOAD_ROW_ERRORS_SUCCESS: {
      return dotProp.set(state, 'entities.row_errors', existingRecords => ({
        ...existingRecords,
        ...action.rowErrors
      }));
    }

    default:
      return state;
  }
};

const insertInputSchema = (state, action) => {
  switch (action.type) {
    case INSERT_INPUT_SCHEMA: {
      let stateWithUpdatedInputSchemas = state;

      action.inputSchemaUpdates.forEach(
        update =>
          (stateWithUpdatedInputSchemas = dotProp.set(
            stateWithUpdatedInputSchemas,
            `entities.input_schemas.${update.id}`,
            record => ({
              ...record,
              ...update
            })
          ))
      );

      return dotProp.set(stateWithUpdatedInputSchemas, 'entities.input_columns', existingRecords => ({
        ...existingRecords,
        ...action.inputColumns
      }));
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
  loadData,
  insertInputSchema
);
