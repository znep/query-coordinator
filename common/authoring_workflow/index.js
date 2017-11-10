/* eslint-disable no-unused-vars */
import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';
import utils from 'common/js_utils';
import { helpers } from 'common/visualizations';

import reducer from './reducers';
import getVifTemplates from './vifs';
import { setVifCheckpoint, setFilters } from './actions';
import { load } from './vifs/loader';
import { defaultState as defaultMetadata } from './reducers/metadata';
import { getVifs } from './selectors/vifAuthoring';
import AuthoringWorkflow from './components/AuthoringWorkflow';

module.exports = function(element, configuration) {
  const logger = createLogger();

  let vif = _.get(configuration, 'vif');
  const filters = _.get(configuration, 'filters', []);
  const formatVersion = _.get(vif, 'format.version');
  const formatType = _.get(vif, 'format.type');
  const locale = _.get(configuration, 'locale', 'en');

  utils.assertIsOneOfTypes(formatVersion, 'number');
  utils.assert(formatType === 'visualization_interchange_format');

  vif = vif ? helpers.VifHelpers.migrateVif(vif) : {};

  // Adding initial VIF to vifs list
  // Serves as a fallback for reset options
  const vifs = _.merge(getVifTemplates(), { initialVif: vif });
  const vifType = _.get(vif, 'series[0].type', null);
  const initialState = {
    metadata: defaultMetadata,
    vifAuthoring: {
      vifs: vifs,
      authoring: {
        filters,
        selectedVisualizationType: vifType,
        showCenteringAndZoomingSaveMessage: false
      }
    }
  };

  this.element = element;
  this.configuration = configuration;

  const middleware = [thunk];
  if (this.configuration.useLogger) {
    middleware.push(logger);
  }

  this.store = createStore(reducer, initialState, applyMiddleware(...middleware));

  load(this.store.dispatch, vif);
  this.store.dispatch(setFilters(filters));

  this.render = () => {
    ReactDOM.render(
      <Provider store={this.store}>
        <AuthoringWorkflow {...this.configuration} />
      </Provider>,
      this.element
    );
  };

  this.destroy = () => {
    // We need to clear the React callstack before attempting to unmount in order to avoid a race
    // condition when calling destroy immediately after it re-renders in React. A way to avoid this
    // would be to not use this container function and use the React component and Redux store
    // directly. :(
    _.defer(() => ReactDOM.unmountComponentAtNode(this.element));
  };

  this.render();
};
