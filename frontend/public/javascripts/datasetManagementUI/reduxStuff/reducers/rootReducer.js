import { combineReducers } from 'redux';
import reduceReducers from 'reduce-reducers';
import entities from 'reduxStuff/reducers/entities';
import ui from 'reduxStuff/reducers/ui';
import createUpload from 'reduxStuff/reducers/createUpload';
import bootstrapApp from 'reduxStuff/reducers/bootstrapApp';
import uploadFile from 'reduxStuff/reducers/uploadFile';
import listenForOutputSchema from 'reduxStuff/reducers/listenForOutputSchema';
import loadData from 'reduxStuff/reducers/loadData';
import insertInputSchema from 'reduxStuff/reducers/insertInputSchema';
import applyRevision from 'reduxStuff/reducers/applyRevision';
import loadRevision from 'reduxStuff/reducers/loadRevision';

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
