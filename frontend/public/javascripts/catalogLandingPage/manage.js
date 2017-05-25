import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import airbrake from 'common/airbrake';
import reducer from './reducers';
import Manager from './components/Manager';

const middleware = [thunk];

if (window.serverConfig.environment === 'development') {
  middleware.push(createLogger({
    duration: true,
    timestamp: false,
    collapsed: true
  }));
} else {
  airbrake.init(_.get(window, 'serverConfig.airbrakeProjectId'), _.get(window, 'serverConfig.airbrakeKey'));
}

const store = createStore(reducer, applyMiddleware(...middleware));

ReactDOM.render(
  <Provider store={store}>
    <Manager />
  </Provider>,
  document.querySelector('#catalog-landing-page-manage')
);

// Show the footer
const footer = document.querySelector('#site-chrome-footer');
if (footer) {
  footer.style.visibility = 'visible';
}
