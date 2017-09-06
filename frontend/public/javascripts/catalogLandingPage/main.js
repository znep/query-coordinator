import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import _ from 'lodash';
import airbrake from 'common/airbrake';
import reducer from './reducers';
import App from './App';
import SearchApp from './SearchApp';
import { dateLocalize } from 'common/locale';
import { AppContainer } from 'react-hot-loader';

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
    <AppContainer>
      <SearchApp store={store} />
    </AppContainer>,
    document.querySelector('#search-content')
  );
}

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./SearchApp', () => {
    const NextApp = require('./SearchApp').default; //eslint-disable-line
    ReactDOM.render(
      <AppContainer>
        <NextApp store={store} />
      </AppContainer>,
      document.querySelector('#search-content')
    );
  });
}

ReactDOM.render(
  <AppContainer>
    <App store={store} />
  </AppContainer>,
  document.querySelector('#catalog-landing-page')
);

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./App', () => {
    const NextApp = require('./App').default; //eslint-disable-line
    ReactDOM.render(
      <AppContainer>
        <NextApp store={store} />
      </AppContainer>,
      document.querySelector('#catalog-landing-page')
    );
  });
}

// Show the footer
const footer = document.querySelector('#site-chrome-footer');
if (footer) {
  footer.style.visibility = 'visible';
}

document.querySelector('#catalog-landing-page-spinner').style.display = 'none';
document.querySelector('.catalog .browse2-results-pane').style.visibility = 'visible';

Array.from(document.querySelectorAll('.dateLocalize')).forEach(dateLocalize);

require('./catalog');
