/* eslint-disable no-unused-vars */
import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';

import reducer from './reducers';
import vifs from './vifs';
import defaultDatasetMetadata from './defaultDatasetMetadata';
import AuthoringWorkflow from './AuthoringWorkflow';

// Top-level API
module.exports = function(element, configuration) {
  var self = this;
  var logger = createLogger();

  var configurationVif = _.get(configuration, 'vif', {});
  var vifType = _.get(configurationVif, 'series[0].type');
  var clonedVifs = vifs();

  _.each(clonedVifs, function(vif) {
    if (_.isPlainObject(vif)) {
      vif.title = _.get(configurationVif, 'title', null);
      vif.description = _.get(configurationVif, 'description', null);
      vif.series[0].dataSource.datasetUid = _.get(configurationVif, 'series[0].dataSource.datasetUid', null);
      vif.series[0].dataSource.domain = _.get(configurationVif, 'series[0].dataSource.domain', null);
    }
  });

  if (vifType) {
    clonedVifs[vifType] = _.merge({}, clonedVifs[vifType], configurationVif);
  }

  var initialState = {
    vifAuthoring: { vifs: clonedVifs, selectedVisualizationType: vifType },
    datasetMetadata: defaultDatasetMetadata
  };

  self.element = element;
  self.configuration = configuration;
  self.store = createStore(
    reducer,
    initialState,
    applyMiddleware(thunk, logger)
  );

  self.render = function() {
    ReactDOM.render(
      <Provider store={self.store}>
        <AuthoringWorkflow {...self.configuration} />
      </Provider>,
      self.element
    );
  };

  self.destroy = function() {
    return ReactDOM.unmountComponentAtNode(self.element);
  };

  self.render();
};
