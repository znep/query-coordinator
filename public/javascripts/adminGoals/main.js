import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';

import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import rootReducer from './reducers';
import App from './containers/App/App';

import notifyUser from './middlewares/notifyUser';
import fileDownloader from './middlewares/fileDownloader';

let middleware = [thunk, notifyUser, fileDownloader];
if (window.serverConfig.environment === 'development') {
  middleware.push(createLogger());
}

let store = Redux.createStore(rootReducer, Redux.compose(
  Redux.applyMiddleware(...middleware),
  window.devToolsExtension ? window.devToolsExtension() : f => f
));

ReactDOM.render(
  <ReactRedux.Provider store={store}>
    <App />
  </ReactRedux.Provider>,
  document.querySelector('#app'));
