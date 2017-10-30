import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'lodash';
import classNames from 'classnames';

import CatalogFilters from 'common/components/AssetBrowser/components/filters/catalog_filters';
import MobileCatalogFilters from 'common/components/AssetBrowser/components/filters/mobile_catalog_filters';
import CatalogResults from './catalog_results';

export class ResultsAndFilters extends Component {
  render() {
    const { activeTab, isMobile, showFilters } = this.props;

    const catalogFilters = isMobile ?
      <MobileCatalogFilters {...this.props} /> :
      <CatalogFilters {...this.props} />;

    const resultsAndFiltersClasses = classNames('results-and-filters', _.kebabCase(activeTab));

    return (
      <div className={resultsAndFiltersClasses}>
        <CatalogResults {...this.props} />
        {showFilters ? catalogFilters : null}
      </div>
    );
  }
}

ResultsAndFilters.propTypes = {
  activeTab: PropTypes.string.isRequired,
  isMobile: PropTypes.bool.isRequired,
  showFilters: PropTypes.bool
};

const mapStateToProps = (state) => ({
  activeTab: state.header.activeTab,
  isMobile: state.windowDimensions.isMobile
});

export default connect(mapStateToProps)(ResultsAndFilters);
