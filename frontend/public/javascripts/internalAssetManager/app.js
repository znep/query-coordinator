import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import CatalogResults from './components/catalog_results';
import CatalogFilters from './components/catalog_filters';
import Header from './components/header';

export class App extends React.Component {
  render() {
    const { page } = this.props;

    const renderedFilters = (page === 'profile') ? null : <CatalogFilters />;

    return (
      <div>
        <Header page={page} />
        <div className="results-and-filters">
          <CatalogResults page={page} />
          {renderedFilters}
        </div>
      </div>
    );
  }
}

App.propTypes = {
  page: PropTypes.string
};

export default connect(state => state)(App);
