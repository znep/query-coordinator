/* eslint-disable no-unused-vars */
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';

import reducer from './reducers';
import AuthoringWorkflow from './AuthoringWorkflow';

// Top-level API
module.exports = function(element, configuration) {
  var self = this;
  var logger = createLogger();

  self.element = element;
  self.configuration = configuration;
  self.store = createStore(
    reducer,
    applyMiddleware(thunk, logger)
  );

  self.render = function() {
    ReactDOM.render(
      <Provider store={self.store}>
        <AuthoringWorkflow {...configuration}/>
      </Provider>,
      self.element
    );
  };

  self.destroy = function() {
    return ReactDOM.unmountComponentAtNode(self.element);
  };

  self.render();
};
