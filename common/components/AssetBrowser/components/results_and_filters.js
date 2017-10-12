import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import CatalogFilters from 'common/components/AssetBrowser/components/filters/catalog_filters';
import MobileCatalogFilters from 'common/components/AssetBrowser/components/filters/mobile_catalog_filters';
import CatalogResults from './catalog_results';

export class ResultsAndFilters extends Component {
  render() {
    const { isMobile, showFilters } = this.props;

    const catalogFilters = isMobile ?
      <MobileCatalogFilters {...this.props} /> :
      <CatalogFilters {...this.props} />;

    return (
      <div className="asset-browser results-and-filters">
        <CatalogResults {...this.props} />
        {showFilters ? catalogFilters : null}
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
