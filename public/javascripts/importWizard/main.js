import React from 'react';
import { render } from 'react-dom';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import { Provider, connect } from 'react-redux'; // eslint-disable-line no-unused-vars
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';

import airbrake from './airbrake';
import * as Wizard from './wizard';
import * as Upload from './components/uploadFile';
import * as Download from './components/downloadFile';
import * as Metadata from './components/metadata';
import * as ImportColumns from './components/importColumns';
import * as Server from './server';
import * as SaveState from './saveState';
import * as ImportShapefile from './components/importShapefile';
import * as ConnectToEsri from './components/connectToEsri';

import view from 'view';
import importSource from 'importSource';
import issActivities from 'issActivities';
import * as ImportStatus from './importStatus';

const middleware = [thunk];

if (serverConfig.reduxLogging) {
  middleware.push(createLogger({
    duration: true,
    timestamp: false
  }));
}

if (serverConfig.environment !== 'development') {
  airbrake.init();
}

function identityReducer(model = null, action) { // eslint-disable-line no-unused-vars
  return model;
}

const rootReducer = combineReducers({
  datasetId: identityReducer,
  lastSavedVersion: SaveState.update,
  navigation: Wizard.updateNavigation,
  upload: Upload.update,
  download: Download.update,
  connectToEsri: ConnectToEsri.update,
  transform: ImportColumns.update, // null except in the UPLOAD_DATA operation
  importStatus: Server.update,
  layers: ImportShapefile.update,
  metadata: Metadata.update
});

const store = createStore(rootReducer, Wizard.initialNewDatasetModel(view, importSource, issActivities), applyMiddleware(...middleware));
const ConnectedWizard = connect((state) => ({state: state}))(Wizard.view); // eslint-disable-line no-unused-vars

if (ImportStatus.isInProgress(store.getState().importStatus)) {
  const ticket = store.getState().importStatus.ticket;
  store.dispatch(Server.resumePolling(ticket));
}

document.addEventListener('DOMContentLoaded', () => {
  // ^^ this is here because sometimes we use things like blist.licenses, which are included in <script> tags below this
  // eventually should fix by reordering the script tags, but it's hard because some of them are in a rails layout
  render(
    <Provider store={store}>
      <ConnectedWizard />
    </Provider>,
    document.querySelector('#app')
  );
});
