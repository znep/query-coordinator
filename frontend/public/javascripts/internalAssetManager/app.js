import React from 'react';
import { connect } from 'react-redux';
import CatalogResults from './components/catalog_results';
import CatalogFilters from './components/catalog_filters';
import Header from './components/header';

export const App = () => {
  return (
    <div>
      <Header />
      <div className="results-and-filters">
        <CatalogResults />
        <CatalogFilters />
      </div>
    </div>
  );
};

export default connect(state => state)(App);
