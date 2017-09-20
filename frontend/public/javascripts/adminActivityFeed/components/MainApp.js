import React, { PropTypes } from 'react';
import { Provider } from 'react-redux';
import WithLocalization from './WithLocalization';
import App from '../App';

const MainApp = ({ translations, store, hasFilterBar }) => (
  <WithLocalization translations={translations}>
    <Provider store={store}>
      <App hasFilterBar={hasFilterBar} />
    </Provider>
  </WithLocalization>
);

MainApp.propTypes = {
  store: PropTypes.object.isRequired,
  hasFilterBar: PropTypes.bool.isRequired,
  translations: PropTypes.object.isRequired
};

export default MainApp;
