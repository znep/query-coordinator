import dotProp from 'dot-prop-immutable';
import { UPLOAD_FILE_SUCCESS } from 'reduxStuff/actions/manageUploads';

const uploadFile = (state, action) => {
  switch (action.type) {
    case UPLOAD_FILE_SUCCESS: {
      return dotProp.set(state, `entities.sources.${action.sourceId}`, record => ({
        ...record,
        finished_at: action.finishedAt
      }));
    }
    default:
      return state;
  }
};

export default uploadFile;
