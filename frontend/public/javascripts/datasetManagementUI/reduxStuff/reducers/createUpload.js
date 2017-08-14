import dotProp from 'dot-prop-immutable';
import { CREATE_UPLOAD_SUCCESS, UPLOAD_FILE_FAILURE } from 'reduxStuff/actions/manageUploads';

const createUpload = (state, action) => {
  switch (action.type) {
    case CREATE_UPLOAD_SUCCESS:
      return dotProp.set(state, 'entities.sources', existingRecords => ({
        ...existingRecords,
        [action.id]: {
          id: action.id,
          created_by: action.created_by,
          created_at: action.created_at,
          source_type: action.source_type,
          percentCompleted: 0
        }
      }));

    case UPLOAD_FILE_FAILURE:
      return dotProp.set(state, `entities.sources.${action.sourceId}`, record => ({
        ...record,
        failed_at: action.failedAt
      }));

    default:
      return state;
  }
};

export default createUpload;
