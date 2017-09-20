import React from 'react';
import ReactDOM from 'react-dom';
import Immutable from 'immutable';
import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import { AppContainer } from 'react-hot-loader';

import HttpClient from './frontendApi/HttpClient';
import ActivityFeedApi from './frontendApi/ActivityFeedApi';
import serviceLocator from './middlewares/serviceLocator';

import MainApp from './components/MainApp';
import HeaderApp from './components/HeaderApp';

import reducer from './reducer';
import { setActivities, setPagination, loadActivities } from './actions';

const containerElement = document.querySelector('#app');
const headerContainerElement = document.querySelector('#activity-feed-header');
const alertType = containerElement.getAttribute('data-alert-type');
const alertTranslationKey = containerElement.getAttribute(
  'data-alert-translation-key'
);

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
  alert:
    alertType && alertTranslationKey
      ? { type: alertType, translationKey: alertTranslationKey }
      : null
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
  const hasFilterBar = headerContainerElement === null;
  const onRender = () => {
    const initialData = window.initialData;

    if (initialData && initialData.activities && initialData.pager_info) {
      const pagerInfo = initialData.pager_info;

      store.dispatch(setActivities(initialData.activities));
      store.dispatch(
        setPagination({
          currentPage: 1,
          hasNextPage: pagerInfo['has_next_page?'],
          hasPreviousPage: pagerInfo['has_prev_page?']
        })
      );
    } else {
      store.dispatch(loadActivities());
    }
  };

  ReactDOM.render(
    <AppContainer>
      <MainApp
        translations={translations}
        hasFilterBar={hasFilterBar}
        store={store}
      />
    </AppContainer>,
    containerElement,
    onRender
  );

  // Hot Module Replacement API
  if (module.hot) {
    module.hot.accept('./components/MainApp', () => {
      const NextApp = require('./components/MainApp').default; //eslint-disable-line
      ReactDOM.render(
        <AppContainer>
          <NextApp
            translations={translations}
            hasFilterBar={hasFilterBar}
            store={store}
          />
        </AppContainer>,
        containerElement,
        onRender
      );
    });
  }

  if (headerContainerElement) {
    ReactDOM.render(
      <HeaderApp translations={translations} store={store} />,
      headerContainerElement
    );

    // Hot Module Replacement API
    if (module.hot) {
      module.hot.accept('./components/HeaderApp', () => {
        const NextApp = require('./components/HeaderApp').default; //eslint-disable-line
        ReactDOM.render(
          <AppContainer>
            <NextApp
              translations={translations}
              store={store}
            />
          </AppContainer>,
          containerElement,
          onRender
        );
      });
    }
  }
});
