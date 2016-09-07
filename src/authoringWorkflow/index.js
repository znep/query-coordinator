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
import { setVifCheckpoint } from './actions';
import { load } from './vifs/loader';
import { defaultState as defaultMetadata } from './reducers/metadata';
import { migrateVif } from '../helpers/VifHelpers';
import { getVifs } from './selectors/vifAuthoring';

import AuthoringWorkflow from './components/AuthoringWorkflow';

module.exports = function(element, configuration) {
  const logger = createLogger();

  let vif = _.get(configuration, 'vif');
  const formatVersion = _.get(vif, 'format.version');
  const formatType = _.get(vif, 'format.type');
  const locale = _.get(configuration, 'locale', 'en');

  utils.assertIsOneOfTypes(formatVersion, 'number');
  utils.assert(formatType === 'visualization_interchange_format');

  vif = vif ? migrateVif(vif) : {};

  const vifType = _.get(vif, 'series[0].type', null);
  const initialState = {
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
  setLocale(locale);

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
