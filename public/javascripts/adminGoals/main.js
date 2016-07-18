import Immutable from 'immutable';
import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware, compose } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import reducers from './reducers';
import App from './containers/App/App';
import {
  tableLoadPage
} from './actions/goalTableActions';

let middleware = [thunk];
if (window.serverConfig.environment === 'development') {
  middleware.push(createLogger());
}

const initialState = Immutable.fromJS({
	translations: window.translations,

  goalTableData: {
    goals: [],
    dashboards: {},
    cachedUsers: {},
    cachedGoalExtras: {},
    selectedRows: [],
    rowsPerPage: 25,
    currentPage: 1,
    tableOrder: { direction: 'asc' },
    goalQuickEditOpenGoalId: null,
    goalTableAlert: {},
    goalQuickEditAlert: {}
  },

  editMultipleItemsForm: {
    visible: false,
    goal: {},
    updateInProgress: false
  }
});

let store = createStore(reducers, initialState,  compose(
  applyMiddleware(...middleware),
  window.devToolsExtension ? window.devToolsExtension() : f => f
));

store.dispatch(tableLoadPage());

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.querySelector('#app'));
