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

  this.element = element;
  this.configuration = configuration;
  this.store = createStore(reducer, initialState, applyMiddleware(thunk, logger));

  load(this.store.dispatch, vif);
  setLocale(_.get(this.configuration, 'locale', 'en'));

  this.render = () => {
    ReactDOM.render(
      <Provider store={this.store}>
        <AuthoringWorkflow {...this.configuration} />
      </Provider>,
      this.element
    );
  };

  this.destroy = () => {
    return ReactDOM.unmountComponentAtNode(this.element);
  };

  this.render();
};
