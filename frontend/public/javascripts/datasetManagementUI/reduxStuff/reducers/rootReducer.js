import { combineReducers } from 'redux';
import reduceReducers from 'reduce-reducers';
import entities from 'reduxStuff/reducers/entities';
import ui from 'reduxStuff/reducers/ui';
import bootstrapApp from 'reduxStuff/reducers/bootstrapApp';
import uploadFile from 'reduxStuff/reducers/uploadFile';
import loadData from 'reduxStuff/reducers/loadData';
import applyRevision from 'reduxStuff/reducers/applyRevision';
import loadRevision from 'reduxStuff/reducers/loadRevision';
import createSource from 'reduxStuff/reducers/createSource';

const combined = combineReducers({
  entities,
  ui
});

export default reduceReducers(
  combined,
  bootstrapApp,
  uploadFile,
  loadData,
  applyRevision,
  loadRevision,
  createSource
);
