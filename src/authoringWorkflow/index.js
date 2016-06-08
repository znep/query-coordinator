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

import { getDatasetUid, getDomain } from './selectors/vifAuthoring';
import { setDataSource } from './actions';

function propagateUserDefinedVifValuesToAllVifs(vif) {
  var vifType = _.get(vif, 'series[0].type');
  var clonedVifs = vifs();

  _.each(clonedVifs, function(clonedVif) {
    _.set(clonedVif, 'title', _.get(vif, 'title', null));
    _.set(clonedVif, 'description', _.get(vif, 'description', null));
    _.set(clonedVif, 'series[0].dataSource.datasetUid', _.get(vif, 'series[0].dataSource.datasetUid', null));
    _.set(clonedVif, 'series[0].dataSource.domain', _.get(vif, 'series[0].dataSource.domain', null));
  });

  if (vifType) {
    clonedVifs[vifType] = _.merge({}, clonedVifs[vifType], vif);
  }

  return clonedVifs;
}

module.exports = function(element, configuration) {
  var self = this;
  var logger = createLogger();

  var vif = _.get(configuration, 'vif', {});
  var vifType = _.get(vif, 'series[0].type', 'columnChart');

  var initialState = {
    vifAuthoring: {
      vifs: propagateUserDefinedVifValuesToAllVifs(vif),
      selectedVisualizationType: vifType
    },
    datasetMetadata: defaultDatasetMetadata
  };

  self.element = element;
  self.configuration = configuration;
  self.store = createStore(
    reducer,
    initialState,
    applyMiddleware(thunk, logger)
  );

  self.store.dispatch(setDataSource({
    datasetUid: getDatasetUid(initialState.vifAuthoring),
    domain: getDomain(initialState.vifAuthoring)
  }));

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
