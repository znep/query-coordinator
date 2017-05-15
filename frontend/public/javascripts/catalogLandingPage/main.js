import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import _ from 'lodash';
import airbrake from '../common/airbrake';
import reducer from './reducers';
import App from './App';
import Search from './components/Search';
import { dateLocalize } from '../common/locale';

const middleware = [thunk];

if (_.get(window, 'serverConfig.environment') === 'development') {
  middleware.push(createLogger({
    duration: true,
    timestamp: false,
    collapsed: true
  }));
} else {
  airbrake.init(_.get(window, 'serverConfig.airbrakeProjectId'), _.get(window, 'serverConfig.airbrakeKey'));
}

const store = createStore(reducer, applyMiddleware(...middleware));

// EN-15369, EN-15600: Render the non-autocomplete search bar. If there is no #search-content div
// then we are using the autocomplete searchbar instead of the Search react component.
// TODO: re-implement the autocomplete search behavior in the Search react component.
if (document.querySelector('#search-content')) {
  ReactDOM.render(
    <Provider store={store}>
      <Search />
    </Provider>,
    document.querySelector('#search-content')
  );
}

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.querySelector('#catalog-landing-page')
);

// Show the footer
const footer = document.querySelector('#site-chrome-footer');
if (footer) {
  footer.style.visibility = 'visible';
}

document.querySelector('#catalog-landing-page-spinner').style.display = 'none';
document.querySelector('.catalog .browse2-results-pane').style.visibility = 'visible';

Array.from(document.querySelectorAll('.dateLocalize')).forEach(dateLocalize);

require('./catalog');
