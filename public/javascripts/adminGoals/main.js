import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware, compose } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import reducers from './reducers';
import App from './containers/App/App';

import notifyUser from './middlewares/notifyUser';

let middleware = [thunk, notifyUser];
if (window.serverConfig.environment === 'development') {
  middleware.push(createLogger());
}

let store = createStore(reducers, compose(
  applyMiddleware(...middleware),
  window.devToolsExtension ? window.devToolsExtension() : f => f
));

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.querySelector('#app'));
