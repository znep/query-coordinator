import dotProp from 'dot-prop-immutable';
import {
  LOAD_ROW_ERRORS_SUCCESS,
  LOAD_COLUMN_ERRORS_SUCCESS,
  LOAD_NORMAL_PREVIEW_SUCCESS
} from 'reduxStuff/actions/loadData';
import { mergeRecords } from 'lib/util';

const loadData = (state, action) => {
  switch (action.type) {
    case LOAD_NORMAL_PREVIEW_SUCCESS: {
      const stateWithUpdatedColData = dotProp.set(state, 'entities.col_data', existingRecords =>
        mergeRecords(existingRecords, action.colData)
      );

      return dotProp.set(stateWithUpdatedColData, 'entities.row_errors', existingRecords => ({
        ...existingRecords,
        ...action.rowErrors
      }));
    }

    case LOAD_COLUMN_ERRORS_SUCCESS: {
      const stateWithUpdatedColData = dotProp.set(state, 'entities.col_data', existingRecords =>
        mergeRecords(existingRecords, action.colData)
      );

      return dotProp.set(stateWithUpdatedColData, 'entities.transforms', existingRecords =>
        mergeRecords(existingRecords, action.transforms)
      );
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

export default loadData;
