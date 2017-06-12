import dotProp from 'dot-prop-immutable';
import {
  LOAD_ROW_ERRORS_SUCCESS,
  LOAD_COLUMN_ERRORS_SUCCESS,
  LOAD_NORMAL_PREVIEW_SUCCESS
} from 'actions/loadData';

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
      const stateWithUpdatedColData = _.reduce(
        action.colData,
        (result, dataForTransform, transformId) =>
          dotProp.set(result, ['entities', 'col_data', transformId], existingDataForTransform => ({
            ...existingDataForTransform,
            ...dataForTransform.record
          })),
        state
      );

      return action.transformUpdates.reduce(
        (stateWithUpdatedTransforms, update) =>
          dotProp.set(stateWithUpdatedTransforms, `entities.transforms.${update.id}`, record => ({
            ...record,
            ...update
          })),
        stateWithUpdatedColData
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
