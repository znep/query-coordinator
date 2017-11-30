import { combineReducers } from 'redux';
import dotProp from 'dot-prop-immutable';
import { ADD_TASK_SET } from 'reduxStuff/actions/taskSets';
import { EDIT_VIEW } from 'reduxStuff/actions/views';
import { EDIT_OUTPUT_COLUMN, ADD_OUTPUT_COLUMNS } from 'reduxStuff/actions/outputColumns';
import { EDIT_OUTPUT_SCHEMA } from 'reduxStuff/actions/outputSchemas';
import { EDIT_TRANSFORM } from 'reduxStuff/actions/transforms';
import { EDIT_INPUT_SCHEMA } from 'reduxStuff/actions/inputSchemas';
import { EDIT_INPUT_COLUMN } from 'reduxStuff/actions/inputColumns';
import { UPDATE_PROGRESS } from 'reduxStuff/actions/uploadFile';
import { SOURCE_UPDATE } from 'reduxStuff/actions/createSource';
import { EDIT_REVISION, SET_REVISION_VALUE } from 'reduxStuff/actions/revisions';
import withBatching from './batching';

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

const revisions = (state = {}, action) => {
  switch (action.type) {
    case EDIT_REVISION: {
      return dotProp.set(state, action.id, record => ({
        ...record,
        ...action.payload
      }));
    }

    case SET_REVISION_VALUE: {
      return dotProp.set(state, action.path, action.value);
    }

    default:
      return state;
  }
};

const sources = (state = {}, action) => {
  switch (action.type) {
    case UPDATE_PROGRESS:
      return dotProp.set(state, action.sourceId, record => ({
        ...record,
        percentCompleted: action.percentCompleted
      }));

    case SOURCE_UPDATE:
      return dotProp.set(state, action.sourceId, record => ({
        ...record,
        ...action.changes
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

const inputColumns = (state = {}, action) => {
  switch (action.type) {
    case EDIT_INPUT_COLUMN:
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

const outputColumns = (state = {}, action) => {
  switch (action.type) {
    case EDIT_OUTPUT_COLUMN:
      return {
        ...state,
        [action.id]: {
          ...state[action.id],
          ...action.payload
        }
      };
    case ADD_OUTPUT_COLUMNS:
      return {
        ...state,
        ...action.payload
      };
    default:
      return state;
  }
};

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


const taskSets = (state = {}, action) => {
  switch (action.type) {
    case ADD_TASK_SET:
      return {
        ...state,
        [action.id]: action.taskSet
      };

    default:
      return state;
  }
};

const emailInterests = (state = {}) => state;

const rowErrors = (state = {}) => state;

const colData = (state = {}) => state;

export default combineReducers({
  views,
  revisions,
  sources,
  input_schemas: inputSchemas,
  input_columns: inputColumns,
  output_schemas: outputSchemas,
  output_columns: outputColumns,
  output_schema_columns: outputSchemaColumns,
  transforms: withBatching(transforms),
  task_sets: taskSets,
  email_interests: emailInterests,
  row_errors: rowErrors,
  col_data: colData
});
