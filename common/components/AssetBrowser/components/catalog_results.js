import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'lodash';
import classNames from 'classnames';

import ceteraUtils from 'common/cetera/utils';
import * as ceteraHelpers from 'common/components/AssetBrowser/lib/cetera_helpers';
import Autocomplete from 'common/autocomplete/components/Autocomplete';
import SocrataIcon from 'common/components/SocrataIcon';
import I18n from 'common/i18n';

import { MY_ASSETS_TAB } from '../lib/constants';
import ActiveFilterCount from './filters/active_filter_count';
import ResultListTable from './result_list_table';
import Pager from 'frontend/public/javascripts/common/components/Pager';
import ResultCount from './result_count';
import AssetInventoryLink from './asset_inventory_link';
import * as filters from '../actions/filters';
import * as mobile from '../actions/mobile';
import * as pager from '../actions/pager';
import * as pageSizeActions from '../actions/page_size';
import ClearFilters from './filters/clear_filters';

const DEFAULT_RESULTS_PER_PAGE = 10;

export class CatalogResults extends Component {
  constructor(props) {
    super(props);

    this.state = {
      tableView: 'list'
    };

    _.bindAll(this,
      'fetchAutocompleteSuggestions',
      'renderError',
      'renderFooter',
      'renderTable',
      'renderTopbar'
    );
  }

  componentWillMount() {
    const { fetchInitialResults, initialResultsFetched, pageSize, updatePageSize } = this.props;

    if (!initialResultsFetched) {
      fetchInitialResults({ pageSize });
      updatePageSize(pageSize);
    }
  }

  renderError() {
    if (this.props.fetchingResultsError) {
      const errorDetails = _.get(this.props, 'fetchingResultsErrorType', 'fetching_results');
      console.error(errorDetails);

      return (
        <div className="alert error">
          {I18n.t('shared.asset_browser.errors.fetching_results')}
        </div>
      );
    }
  }

  // This function is used by Autocomplete to ensure that all active filter parameters are applied
  // to calls to the Cetera to fetch autocomplete suggestions. It is in this module in order to
  // have access to the allFilters prop.
  fetchAutocompleteSuggestions(searchTerm, callback) { // numberOfResults, anonymous args unused
    const { allFilters } = this.props;

    if (_.isEmpty(searchTerm)) {
      callback([]);
    } else {
      const translatedFilters = ceteraHelpers.translateFiltersToQueryParameters(allFilters);
      ceteraUtils.autocompleteQuery(searchTerm, translatedFilters).
        then(callback);
    }
  }

  renderTopbar() {
    const {
      allFilters,
      baseFilters,
      changeQ,
      clearAllFilters,
      clearSearch,
      currentQuery,
      isMobile,
      page,
      showManageAssets,
      showSearchField,
      toggleFilters
    } = this.props;

    const autocompleteOptions = {
      animate: true,
      anonymous: false,
      collapsible: false,
      currentQuery: currentQuery,
      getSearchResults: this.fetchAutocompleteSuggestions,
      millisecondsBeforeSearch: 60,
      mobile: isMobile,
      onChooseResult: changeQ,
      onClearSearch: clearSearch,
      adminHeaderClasses: []
    };

    const clearFiltersProps = {
      allFilters,
      buttonStyle: true,
      baseFilters,
      clearAllFilters,
      clearSearch,
      showTitle: false
    };

    const allAssetsButton = showManageAssets ? (
      <div className="manage-assets-link">
        <a href={`/admin/assets?tab=${MY_ASSETS_TAB}`}>
          <button className="btn btn-primary all-assets-button">
            {I18n.t('shared.asset_browser.view_and_manage_assets')}
            <SocrataIcon name="arrow-right" />
          </button>
        </a>
      </div>
    ) : null;

    const mobileFilterToggle = isMobile ? (
      <a href="#" className="mobile-filter-toggle" onClick={toggleFilters}>
        {I18n.t('shared.asset_browser.mobile.filters')}
        <ActiveFilterCount />
        <SocrataIcon name="arrow-right" />
      </a>
    ) : null;

    const clearFiltersButton = isMobile ? null : <ClearFilters {...clearFiltersProps} />;

    const topbarClassnames = classNames('topbar clearfix', {
      'mobile': isMobile
    });

    const searchField = showSearchField ? <Autocomplete {...autocompleteOptions} /> : null;

    return (
      <div className={topbarClassnames}>
        {mobileFilterToggle}
        {searchField}
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
    const {
      fetchingResults,
      pageNumber,
      pageSize,
      resultSetSize,
      showAssetInventoryLink,
      showPager
    } = this.props;

    if (fetchingResults) {
      return;
    }

    const pagerProps = {
      changePage: this.props.changePage,
      currentPage: pageNumber,
      resultCount: resultSetSize,
      resultsPerPage: pageSize || DEFAULT_RESULTS_PER_PAGE
    };

    const resultCountProps = {
      pageNumber,
      resultsPerPage: pageSize || DEFAULT_RESULTS_PER_PAGE,
      total: resultSetSize
    };

    // EN-18329: Hide the Asset Inventory button on the /profile page,
    // or on the /admin/assets page when filtered on "My Assets".
    const renderedAssetInventoryLink = showAssetInventoryLink ? (
      <div className="asset-inventory-link-wrapper">
        <AssetInventoryLink />
      </div>
    ) : null;

    const pager = showPager ? (
      <div className="pagination-and-result-count">
        <Pager {...pagerProps} />
        <ResultCount {...resultCountProps} />
      </div>
    ) : null;

    // If there's nothing inside the footer, don't render it at all.
    if (!showPager && !showAssetInventoryLink) {
      return;
    }

    return (
      <div className="catalog-footer">
        {pager}
        {renderedAssetInventoryLink}
      </div>
    );
  }

  render() {
    const { showPager, showAssetInventoryLink } = this.props;

    const catalogResultsClassnames = classNames('catalog-results', {
      'mobile': this.props.isMobile,
      'footerless': !showPager && !showAssetInventoryLink
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
  allFilters: PropTypes.object,
  baseFilters: PropTypes.object,
  changePage: PropTypes.func.isRequired,
  changeQ: PropTypes.func.isRequired,
  clearSearch: PropTypes.func,
  clearAllFilters: PropTypes.func.isRequired,
  currentQuery: PropTypes.string,
  fetchInitialResults: PropTypes.func.isRequired,
  fetchingResults: PropTypes.bool,
  fetchingResultsError: PropTypes.bool,
  fetchingResultsErrorType: PropTypes.string,
  initialResultsFetched: PropTypes.bool.isRequired,
  isMobile: PropTypes.bool.isRequired,
  order: PropTypes.object,
  page: PropTypes.string,
  pageNumber: PropTypes.number,
  pageSize: PropTypes.number,
  resultSetSize: PropTypes.number.isRequired,
  showAssetInventoryLink: PropTypes.bool,
  toggleFilters: PropTypes.func.isRequired,
  updatePageSize: PropTypes.func.isRequired
};

CatalogResults.defaultProps = {
  allFilters: {},
  baseFilters: {},
  currentQuery: '',
  fetchingResults: false,
  fetchingResultsError: false,
  pageNumber: 1,
  pageSize: DEFAULT_RESULTS_PER_PAGE
};

const mapStateToProps = (state) => ({
  allFilters: state.filters,
  currentQuery: state.filters.q,
  fetchingResults: state.catalog.fetchingResults,
  fetchingResultsError: state.catalog.fetchingResultsError,
  fetchingResultsErrorType: state.catalog.fetchingResultsErrorType,
  initialResultsFetched: state.catalog.initialResultsFetched,
  isMobile: state.windowDimensions.isMobile,
  order: state.catalog.order,
  pageNumber: state.catalog.pageNumber,
  resultSetSize: state.catalog.resultSetSize
});

const mapDispatchToProps = (dispatch) => ({
  changePage: (pageNumber) => dispatch(pager.changePage(pageNumber)),
  changeQ: (query) => dispatch(filters.changeQ(query)),
  clearAllFilters: (shouldClearSearch, baseFilters) => dispatch(filters.clearAllFilters(shouldClearSearch, baseFilters)),
  clearSearch: () => dispatch(filters.clearSearch()),
  fetchInitialResults: (parameters) => dispatch(ceteraHelpers.fetchInitialResults(parameters)),
  toggleFilters: () => dispatch(mobile.toggleFilters()),
  updatePageSize: (pageSize) => dispatch(pageSizeActions.updatePageSize(pageSize))
});

export default connect(mapStateToProps, mapDispatchToProps)(CatalogResults);
