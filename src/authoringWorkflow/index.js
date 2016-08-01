/* eslint-disable no-unused-vars */
import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';
import utils from 'socrata-utils';

import reducer from './reducers';
import vifs from './vifs';
import { defaultState as defaultMetadata } from './reducers/metadata';
import AuthoringWorkflow from './components/AuthoringWorkflow';
import { setLocale } from '../I18n';

import { getDatasetUid, getDomain } from './selectors/vifAuthoring';
import { setDataSource } from './actions';

import { migrateVif } from '../helpers/VifHelpers';

function propagateUserDefinedVifValuesToAllVifs(vif) {
  var vifType = _.get(vif, 'series[0].type', null);
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

  utils.assertHasProperty(configuration, 'vif.format.version');
  utils.assert(_.get(configuration, 'vif.format.type') === 'visualization_interchange_format');

  var vif = _.get(configuration, 'vif');
  vif = vif ? migrateVif(vif) : {};
  var vifType = _.get(vif, 'series[0].type', null);

  var initialState = {
    metadata: defaultMetadata,
    vifAuthoring: {
      vifs: propagateUserDefinedVifValuesToAllVifs(vif),
      authoring: {
        selectedVisualizationType: vifType,
        showCenteringAndZoomingSaveMessage: false
      }
    }
  };

  var domain = vifType ?
    getDomain(initialState.vifAuthoring) :
    _.get(initialState, 'vifAuthoring.vifs.columnChart.series[0].dataSource.domain');
  var datasetUid = vifType ?
    getDatasetUid(initialState.vifAuthoring) :
    _.get(initialState, 'vifAuthoring.vifs.columnChart.series[0].dataSource.datasetUid');

  self.element = element;
  self.configuration = configuration;
  self.store = createStore(reducer, initialState, applyMiddleware(thunk, logger));
  self.store.dispatch(setDataSource({datasetUid, domain}));

  setLocale(_.get(self.configuration, 'locale', 'en'));

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
