import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import WithLocalization from './WithLocalization';
import FilterBar from './FilterBar/FilterBar';

const HeaderApp = ({ translations, store }) => (
  <WithLocalization translations={translations}>
    <Provider store={store}>
      <FilterBar />
    </Provider>
  </WithLocalization>
);

HeaderApp.propTypes = {
  translations: PropTypes.object.isRequired,
  store: PropTypes.object.isRequired
};

export default HeaderApp;
