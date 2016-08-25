import React from 'react';
import { render } from 'react-dom';
import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
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

import view from 'view';
import importSource from 'importSource';


if (serverConfig.environment !== 'development') {
  airbrake.init();
}

const enhancer = compose(
  applyMiddleware(
    createLogger({ duration: true, timestamp: false }),
    thunk
  )
);

function identityReducer(model = null, action) { // eslint-disable-line no-unused-vars
  return model;
}

const rootReducer = combineReducers({
  datasetId: identityReducer,
  lastSavedVersion: SaveState.update,
  navigation: Wizard.updateNavigation,
  upload: Upload.update,
  download: Download.update,
  transform: ImportColumns.update, // null except in the UPLOAD_DATA operation
  importStatus: Server.update,
  layers: ImportShapefile.update,
  metadata: Metadata.update
});

const store = createStore(rootReducer, Wizard.initialNewDatasetModel(view, importSource), enhancer);
const ConnectedWizard = connect((state) => ({state: state}))(Wizard.view); // eslint-disable-line no-unused-vars

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
