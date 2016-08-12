import React from 'react';
import { render } from 'react-dom';
import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import { Provider, connect } from 'react-redux'; // eslint-disable-line no-unused-vars
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import _ from 'lodash';

import airbrake from './airbrake';
import * as Wizard from './wizard';
import * as Upload from './components/uploadFile';
import * as Download from './components/downloadFile';
import * as Metadata from './components/metadata';
import * as ImportColumns from './components/importColumns';
import * as Server from './server';
import * as ImportShapefile from './components/importShapefile';

import view from 'view';

if (serverConfig.environment !== 'development') {
  airbrake.init();
}

const enhancer = compose(
  applyMiddleware(
    createLogger({ duration: true, timestamp: false }),
    thunk
  )
);

function identityReducer(model, action) { // eslint-disable-line no-unused-vars
  if (_.isUndefined(model)) {
    return null;
  } else {
    return model;
  }
}

const rootReducer = combineReducers({
  datasetId: identityReducer,
  navigation: Wizard.updateNavigation,
  upload: Upload.update,
  download: Download.update,
  transform: ImportColumns.update, // null except in the UploadData operation
  importStatus: Server.update,
  layers: ImportShapefile.update,
  metadata: Metadata.update
});

const store = createStore(rootReducer, Wizard.initialNewDatasetModel(view), enhancer);
const ConnectedWizard = connect((state) => ({state: state}))(Wizard.view); // eslint-disable-line no-unused-vars

render(
  <Provider store={store}>
    <ConnectedWizard />
  </Provider>,
  document.querySelector('#app')
);