import React from 'react';
import { connect } from 'react-redux';
import CatalogResults from './components/CatalogResults';

export const App = () => {
  return (
    <div>
      {/* <Header />  TODO: for the My Assets / All Assets toggle, and the asset counts */}
      <CatalogResults />
    </div>
  );
};

export default connect((state) => (state))(App);
