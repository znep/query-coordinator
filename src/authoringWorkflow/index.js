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
import { setLocale } from '../I18n';
import { setDataSource } from './actions';
import { load } from './vifs/loader';
import { defaultState as defaultMetadata } from './reducers/metadata';
import { getDatasetUid, getDomain } from './selectors/vifAuthoring';
import { migrateVif } from '../helpers/VifHelpers';

import AuthoringWorkflow from './components/AuthoringWorkflow';

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
      vifs: vifs(),
      authoring: {
        selectedVisualizationType: vifType,
        showCenteringAndZoomingSaveMessage: false
      }
    }
  };

  self.element = element;
  self.configuration = configuration;
  self.store = createStore(reducer, initialState, applyMiddleware(thunk, logger));

  load(self.store.dispatch, vif);
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
