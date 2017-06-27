import { combineReducers } from 'redux';
import reduceReducers from 'reduce-reducers';
import entities from 'reducers/entities';
import ui from 'reducers/ui';
import createUpload from 'reducers/createUpload';
import bootstrapApp from 'reducers/bootstrapApp';
import uploadFile from 'reducers/uploadFile';
import pollForOutputSchema from 'reducers/pollForOutputSchema';
import loadData from 'reducers/loadData';
import insertInputSchema from 'reducers/insertInputSchema';
import applyRevision from 'reducers/applyRevision';

const combined = combineReducers({
  entities,
  ui
});

export default reduceReducers(
  combined,
  createUpload,
  bootstrapApp,
  uploadFile,
  pollForOutputSchema,
  loadData,
  insertInputSchema,
  applyRevision
);