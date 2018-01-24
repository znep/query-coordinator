import { combineReducers } from 'redux';
import reduceReducers from 'reduce-reducers';
import entities from 'datasetManagementUI/reduxStuff/reducers/entities';
import ui from 'datasetManagementUI/reduxStuff/reducers/ui';
import uploadFile from 'datasetManagementUI/reduxStuff/reducers/uploadFile';
import loadData from 'datasetManagementUI/reduxStuff/reducers/loadData';
import applyRevision from 'datasetManagementUI/reduxStuff/reducers/applyRevision';
import loadRevision from 'datasetManagementUI/reduxStuff/reducers/loadRevision';
import createSource from 'datasetManagementUI/reduxStuff/reducers/createSource';
import showOutputSchema from 'datasetManagementUI/reduxStuff/reducers/showOutputSchema';

const combined = combineReducers({
  entities,
  ui
});

export default reduceReducers(
  combined,
  uploadFile,
  loadData,
  applyRevision,
  loadRevision,
  createSource,
  showOutputSchema
);
