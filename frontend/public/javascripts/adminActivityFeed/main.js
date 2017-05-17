import React from 'react';
import ReactDOM from 'react-dom';
import Immutable from 'immutable';
import { createStore, applyMiddleware, compose } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';

import HttpClient from './frontendApi/HttpClient';
import ActivityFeedApi from './frontendApi/ActivityFeedApi';
import Localization from './components/Localization/Localization';
import serviceLocator from './middlewares/serviceLocator';

import App from './App';

import reducer from './reducer';
import {
  setActivities,
  setPagination,
  loadActivities
} from './actions';

const containerElement = document.querySelector('#app');
const alertType = containerElement.getAttribute('data-alert-type');
const alertTranslationKey = containerElement.getAttribute('data-alert-translation-key');

const initialState = Immutable.fromJS({
  activities: [],
  loadingFeed: false,
  filter: {
    event: 'All',
    status: 'All',
    dateFrom: null,
    dateTo: null
  },
  pagination: {
    currentPage: 1,
    hasNextPage: false,
    hasPreviousPage: false
  },
  alert: alertType && alertTranslationKey ? { type: alertType, translationKey: alertTranslationKey } : null
});

const httpClient = new HttpClient();

const composer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const enhancer = composer(
  applyMiddleware(
    serviceLocator({
      api: new ActivityFeedApi(httpClient)
    }),
    thunk
  )
);

const store = createStore(reducer, initialState, enhancer);

document.addEventListener('DOMContentLoaded', () => {
  const translations = (blist || {}).translations || {};
  ReactDOM.render(
    <Localization
      translations={translations}
      locale={serverConfig.locale || 'en'}
      localePrefix={serverConfig.localePrefix}
      returnKeyForNotFound={true}
      root="screens.admin.jobs">
      <Provider store={store}>
        <App />
      </Provider>
    </Localization>,
    containerElement,
    () => {
      const initialData = window.initialData;

      if (initialData && initialData.activities && initialData.pager_info) {
        const pagerInfo = initialData.pager_info;

        store.dispatch(setActivities(initialData.activities));
        store.dispatch(setPagination({
          currentPage: 1,
          hasNextPage: pagerInfo['has_next_page?'],
          hasPreviousPage: pagerInfo['has_prev_page?']
        }));
      } else {
        store.dispatch(loadActivities());
      }
    }
  );
});
