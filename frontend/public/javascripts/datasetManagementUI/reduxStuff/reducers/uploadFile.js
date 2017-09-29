import dotProp from 'dot-prop-immutable';
import { UPLOAD_FILE_SUCCESS, UPLOAD_FILE_FAILURE } from 'reduxStuff/actions/uploadFile';

const uploadFile = (state, action) => {
  switch (action.type) {
    case UPLOAD_FILE_SUCCESS: {
      return dotProp.set(state, `entities.sources.${action.sourceId}`, record => ({
        ...record,
        finished_at: action.finishedAt
      }));
    }

    case UPLOAD_FILE_FAILURE:
      return dotProp.set(state, `entities.sources.${action.sourceId}`, record => ({
        ...record,
        failed_at: action.failedAt
      }));

    default:
      return state;
  }
};

export default uploadFile;
