import React, { PropTypes } from 'react';
import { Provider } from 'react-redux';
import WithLocalization from './WithLocalization';
import FilterBar from './FilterBar/FilterBar';

const HeaderApp = ({ translations, reduxStore }) => (
  <WithLocalization translations={translations}>
    <Provider store={reduxStore}>
      <FilterBar />
    </Provider>
  </WithLocalization>
);

HeaderApp.propTypes = {
  translations: PropTypes.object.isRequired,
  store: PropTypes.object.isRequired
};

export default HeaderApp;
