import React, { PropTypes } from 'react';
import { Router } from 'react-router';
import rootRoute from 'routes';
import { Provider } from 'react-redux';

const App = ({ store, history }) => (
  <Provider store={store}>
    <Router history={history}>{rootRoute(store)}</Router>
  </Provider>
);

App.propTypes = {
  store: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired
};

export default App;
