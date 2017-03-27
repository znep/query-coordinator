import React from 'react';
import ReactDOM from 'react-dom';
import immutable from 'immutable';
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

const initialState = immutable.fromJS({
  activities: [],
  loadingFeed: false,
  filtering: {
    eventType: 'All',
    eventStatus: 'All',
    dateFrom: null,
    dateTo: null
  },
  pagination: null,
  error: containerElement.getAttribute('data-error')
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
      returnKeyForNotFound={true}
      root="screens.admin.jobs">
      <Provider store={store}>
        <App />
      </Provider>
    </Localization>,
    containerElement,
    () => {
      if (window.initialData && window.initialData.activities && window.initialData.pager_info) {
        store.dispatch(setActivities(window.initialData.activities));
        store.dispatch(setPagination(window.initialData.pager_info));
      } else {
        store.dispatch(loadActivities());
      }
    }
  );
});
