import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import App from './App.js';

// This file exists because we need to give our app root to webpack's module.hot.accept
// to watch as a dependency (see https://github.com/gaearon/react-hot-loader/tree/master/docs#migration-to-30).
// However, since we use the redux state in the <App> component and expect it to update
// when the state updates, <App> needs to be below <Provider> in the component hierarchy.
// Otherwise <App> will not update with the state.

const Root = ({ store }) => (
  <Provider store={store}>
    <App />
  </Provider>
);

Root.propTypes = {
  store: PropTypes.object.isRequired
};

export default Root;
