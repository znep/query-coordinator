import React from 'react';
import { connect } from 'react-redux';
import CatalogResults from './components/CatalogResults';
import CatalogFilters from './components/CatalogFilters';
import Header from './components/Header';

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
