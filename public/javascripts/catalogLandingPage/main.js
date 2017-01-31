import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import a11y from 'react-a11y';
import airbrake from './lib/airbrake';
import reducer from './reducers';
import App from './App';
import Search from './components/Search';

var middleware = [thunk];

if (window.serverConfig.environment === 'development') {
  a11y(React, { ReactDOM: ReactDOM });
  middleware.push(createLogger({
    duration: true,
    timestamp: false,
    collapsed: true
  }));
} else {
  airbrake.init();
}

// var store = createStore(catalogLandingPage, applyMiddleware(...middleware));
var store = createStore(reducer, applyMiddleware(...middleware));

// Render the search bar
ReactDOM.render(
  <Provider store={store}>
    <Search />
  </Provider>,
  document.querySelector('#search-content')
);

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.querySelector('#catalog-landing-page-content')
);

// Hide the spinner that is displayed at page load once everything above has rendered.
document.querySelector('.catalog-landing-page .main-spinner').style.display = 'none';
