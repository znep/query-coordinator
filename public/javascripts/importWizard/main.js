import React from 'react'; // eslint-disable-line no-unused-vars
import { render } from 'react-dom';
import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import { Provider, connect } from 'react-redux';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import _ from 'lodash';

import * as Wizard from './wizard';
import * as Upload from './components/uploadFile';
import * as Metadata from './components/metadata';
import * as ImportShapefile from './components/importShapefile';


const enhancer = compose(
  applyMiddleware(createLogger(), thunk)
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
  transform: identityReducer, // null except in the UploadData operation
  layers: ImportShapefile.update,
  metadata: Metadata.update
});

const store = createStore(rootReducer, Wizard.fakeInitialModel, enhancer);
const ConnectedWizard = connect((state) => ({state: state}))(Wizard.view);

render(
  <Provider store={store}>
    <ConnectedWizard />
  </Provider>,
  document.querySelector('#app')
);
