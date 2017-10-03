import dotProp from 'dot-prop-immutable';
import { UPLOAD_FILE_SUCCESS, SOURCE_UPDATE } from 'reduxStuff/actions/manageUploads';

const uploadFile = (state, action) => {
  switch (action.type) {
    case UPLOAD_FILE_SUCCESS: {
      return dotProp.set(state, `entities.sources.${action.sourceId}`, record => ({
        ...record,
        finished_at: action.finishedAt
      }));
    }
    case SOURCE_UPDATE: {
      return dotProp.set(state, `entities.sources.${action.sourceId}`, record => ({
        ...record,
        ...action.changes
      }));
    }
    default:
      return state;
  }
};

export default uploadFile;
