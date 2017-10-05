import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import CatalogFilters from './catalog_filters';
import CatalogResults from './catalog_results';
import MobileCatalogFilters from './mobile_catalog_filters';

export class ResultsAndFilters extends React.Component {
  render() {
    const { isMobile, page } = this.props;

    let catalogFilters = null;
    if (page !== 'profile') {
      catalogFilters = isMobile ? <MobileCatalogFilters /> : <CatalogFilters />;
    }

    return (
      <div className="results-and-filters">
        <CatalogResults page={page} />
        {catalogFilters}
      </div>
    );
  }
}

ResultsAndFilters.propTypes = {
  isMobile: PropTypes.bool.isRequired,
  page: PropTypes.string
};

const mapStateToProps = (state) => ({
  isMobile: state.windowDimensions.isMobile
});

export default connect(mapStateToProps)(ResultsAndFilters);
