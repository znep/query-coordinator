import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import classNames from 'classnames';

import ActiveFilterCount from './active_filter_count';
import ResultListTable from './result_list_table';
import Pager from 'common/components/Pager';
import ResultCount from './result_count';
import AssetInventoryLink from './asset_inventory_link';
import * as filters from '../actions/filters';
import * as mobile from '../actions/mobile';
import * as pager from '../actions/pager';
import Autocomplete from 'common/autocomplete/components/Autocomplete';
import { getCeteraResults } from 'common/autocomplete/Util';
import ClearFilters from './clear_filters';
import { SocrataIcon } from 'common/components';

const RESULTS_PER_PAGE = 10;

export class CatalogResults extends Component {
  constructor(props) {
    super(props);

    this.state = {
      tableView: 'list'
    };

    _.bindAll(this,
      'renderError',
      'renderFooter',
      'renderTable',
      'renderTopbar'
    );
  }

  renderError() {
    if (this.props.fetchingResultsError) {
      const errorDetails = _.get(this.props, 'fetchingResultsErrorType', 'fetching_results');
      console.error(errorDetails);

      return (
        <div className="alert error">
          {_.get(I18n, 'errors.fetching_results')}
        </div>
      );
    }
  }

  renderTopbar() {
    const { allFilters, changeQ, clearAllFilters, clearSearch, currentQuery, isMobile, page, toggleFilters } =
      this.props;

    const autocompleteOptions = {
      animate: true,
      anonymous: false,
      collapsible: false,
      currentQuery: currentQuery,
      getSearchResults: getCeteraResults,
      millisecondsBeforeSearch: 60,
      mobile: isMobile,
      onChooseResult: changeQ,
      onClearSearch: clearSearch,
      adminHeaderClasses: []
    };

    const clearFiltersProps = {
      allFilters,
      buttonStyle: true,
      clearAllFilters,
      clearSearch,
      showTitle: false
    };

    const allAssetsButton = (page === 'profile') ? (
      <a href="/admin/assets?tab=allAssets">
        <button className="btn btn-default all-assets-button">
          {_.get(I18n, 'all_assets_button')}
          <SocrataIcon name="arrow-right" />
        </button>
      </a>
    ) : null;

    const mobileFilterToggle = isMobile ? (
      <a href="#" className="mobile-filter-toggle" onClick={toggleFilters}>
        {_.get(I18n, 'mobile.filters')}
        <ActiveFilterCount />
        <SocrataIcon name="arrow-right" />
      </a>
    ) : null;

    const clearFiltersButton = isMobile ? null : <ClearFilters {...clearFiltersProps} />;

    const topbarClassnames = classNames('topbar clearfix', {
      'mobile': isMobile
    });

    return (
      <div className={topbarClassnames}>
        <Autocomplete {...autocompleteOptions} />
        {mobileFilterToggle}
        {clearFiltersButton}
        {allAssetsButton}
      </div>
    );
  }

  renderTable() {
    const { fetchingResults } = this.props;
    const { tableView } = this.state;

    const spinner = fetchingResults ? (
      <div className="catalog-results-spinner-container">
        <span className="spinner-default spinner-large"></span>
      </div>
    ) : null;

    if (tableView === 'list') {
      return (
        <div className="table-wrapper">
          <ResultListTable />
          {spinner}
        </div>
      );
    } else {
      // Currently only support for the "list" view. TODO: add "card" view and the ability to toggle them.
      // return <ResultCardTable />;
    }
  }

  renderFooter() {
    const { activeTab, page, pageNumber, fetchingResults, resultSetSize } = this.props;
    if (fetchingResults) {
      return;
    }

    const pagerProps = {
      changePage: this.props.changePage,
      currentPage: pageNumber,
      resultCount: resultSetSize,
      resultsPerPage: RESULTS_PER_PAGE
    };

    const resultCountProps = {
      pageNumber,
      resultsPerPage: RESULTS_PER_PAGE,
      total: resultSetSize
    };

    // EN-18329: Hide the Asset Inventory button on the /profile page,
    // or on the /admin/assets page when filtered on "My Assets".
    const renderedAssetInventoryLink = (page === 'profile' || activeTab === 'myAssets') ? null : (
      <div className="asset-inventory-link-wrapper">
        <AssetInventoryLink />
      </div>
    );

    return (
      <div className="catalog-footer">
        <div className="pagination-and-result-count">
          <Pager {...pagerProps} />
          <ResultCount {...resultCountProps} />
        </div>
        {renderedAssetInventoryLink}
      </div>
    );
  }

  render() {
    const catalogResultsClassnames = classNames('catalog-results', {
      'mobile': this.props.isMobile
    });

    return (
      <div className={catalogResultsClassnames}>
        {this.renderTopbar()}
        {this.renderError()}
        {this.renderTable()}
        {this.renderFooter()}
      </div>
    );
  }
}

CatalogResults.propTypes = {
  activeTab: PropTypes.string.isRequired,
  allFilters: PropTypes.object,
  changePage: PropTypes.func.isRequired,
  changeQ: PropTypes.func.isRequired,
  clearSearch: PropTypes.func,
  clearAllFilters: PropTypes.func.isRequired,
  currentQuery: PropTypes.string,
  customFacets: PropTypes.object.isRequired,
  fetchingResults: PropTypes.bool,
  fetchingResultsError: PropTypes.bool,
  fetchingResultsErrorType: PropTypes.string,
  isMobile: PropTypes.bool.isRequired,
  order: PropTypes.object,
  page: PropTypes.string,
  pageNumber: PropTypes.number,
  resultSetSize: PropTypes.number.isRequired,
  toggleFilters: PropTypes.func.isRequired
};

CatalogResults.defaultProps = {
  currentQuery: '',
  fetchingResults: false,
  fetchingResultsError: false,
  pageNumber: 1
};

const mapStateToProps = (state) => ({
  activeTab: state.header.activeTab,
  allFilters: state.filters,
  currentQuery: state.filters.q,
  customFacets: state.filters.customFacets,
  fetchingResults: state.catalog.fetchingResults,
  fetchingResultsError: state.catalog.fetchingResultsError,
  fetchingResultsErrorType: state.catalog.fetchingResultsErrorType,
  isMobile: state.windowDimensions.isMobile,
  order: state.catalog.order,
  pageNumber: state.catalog.pageNumber,
  resultSetSize: state.catalog.resultSetSize
});

const mapDispatchToProps = (dispatch) => ({
  changePage: (pageNumber) => dispatch(pager.changePage(pageNumber)),
  changeQ: (query) => dispatch(filters.changeQ(query)),
  clearAllFilters: (shouldClearSearch) => dispatch(filters.clearAllFilters(shouldClearSearch)),
  clearSearch: () => dispatch(filters.clearSearch()),
  toggleFilters: () => dispatch(mobile.toggleFilters())
});

export default connect(mapStateToProps, mapDispatchToProps)(CatalogResults);
