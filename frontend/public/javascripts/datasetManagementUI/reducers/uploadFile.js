import dotProp from 'dot-prop-immutable';
import { UPLOAD_FILE_SUCCESS } from 'actions/manageUploads';

const uploadFile = (state, action) => {
  switch (action.type) {
    case UPLOAD_FILE_SUCCESS: {
      const stateWithUpdatedUploads = dotProp.set(state, `entities.sources.${action.sourceId}`, record => ({
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

export default uploadFile;
