import dotProp from 'dot-prop-immutable';
import { CREATE_UPLOAD_SUCCESS } from 'actions/manageUploads';

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

export default createUpload;
