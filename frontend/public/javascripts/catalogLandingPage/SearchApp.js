import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import Search from './components/Search';

const SearchApp = ({ store }) => (
  <Provider store={store}>
    <Search />
  </Provider>
);

SearchApp.propTypes = {
  store: PropTypes.object.isRequired
};

export default SearchApp;
