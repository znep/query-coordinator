import { combineReducers } from 'redux';
import reduceReducers from 'reduce-reducers';
import entities from 'reducers/entities';
import ui from 'reducers/ui';
import createUpload from 'reducers/createUpload';
import bootstrapApp from 'reducers/bootstrapApp';
import uploadFile from 'reducers/uploadFile';
import listenForOutputSchema from 'reducers/listenForOutputSchema';
import loadData from 'reducers/loadData';
import insertInputSchema from 'reducers/insertInputSchema';
import applyRevision from 'reducers/applyRevision';
import loadRevision from 'reducers/loadRevision';

const combined = combineReducers({
  entities,
  ui
});

export default reduceReducers(
  combined,
  createUpload,
  bootstrapApp,
  uploadFile,
  listenForOutputSchema,
  loadData,
  insertInputSchema,
  applyRevision,
  loadRevision
);
