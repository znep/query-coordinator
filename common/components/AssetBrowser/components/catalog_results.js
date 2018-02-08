import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'lodash';
import classNames from 'classnames';

import ceteraUtils from 'common/cetera/utils';
import * as ceteraHelpers from 'common/components/AssetBrowser/lib/helpers/cetera';
import Autocomplete from 'common/autocomplete/components/Autocomplete';
import SocrataIcon from 'common/components/SocrataIcon';
import I18n from 'common/i18n';

import * as constants from '../lib/constants';
import ActionDropdown from './action_dropdown';
import ActiveFilterCount from './filters/active_filter_count';
import BackButton from './back_button';
import Pager from 'common/components/Pager';
import ResultCount from './result_count';
import ResultCardContainer from './result_card_container';
import ResultListTable from './result_list_table';
import SortDropdown from './sort_dropdown';
import AssetInventoryLink from './asset_inventory_link';
import * as filters from '../actions/filters';
import * as mobile from '../actions/mobile';
import * as pager from '../actions/pager';
import * as pageSizeActions from '../actions/page_size';
import ClearFilters from './filters/clear_filters';

const DEFAULT_RESULTS_PER_PAGE = 10;
const scope = 'shared.asset_browser';

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
      'renderTopbar',
      'showAssetInventoryLink'
    );
  }

  componentWillMount() {
    const { fetchInitialResults, initialResultsFetched, pageSize, updatePageSize } = this.props;

    if (!initialResultsFetched) {
      fetchInitialResults({ pageSize });
      updatePageSize(pageSize);
    }
  }

  renderError() { // eslint-disable-line react/sort-comp
    if (this.props.fetchingResultsError) {
      const errorDetails = _.get(this.props, 'fetchingResultsErrorType', 'fetching_results');
      console.error('catalogResults:renderError: ', errorDetails);

      return (
        <div className="alert error">
          {I18n.t('errors.fetching_results', { scope })}
        </div>
      );
    }
  }

  // This function is used by Autocomplete to ensure that all active filter parameters are applied
  // to calls to the Cetera to fetch autocomplete suggestions. It is in this module in order to
  // have access to the allFilters prop.
  fetchAutocompleteSuggestions(searchTerm, callback) { // numberOfResults, anonymous args unused
    const { reduxState } = this.props;

    if (_.isEmpty(searchTerm)) {
      callback([]);
    } else {
      // EN-19556: hack to get proper state into query param filters
      const getState = () => { return reduxState; };
      const translatedFilters = ceteraHelpers.mergedCeteraQueryParameters(getState);

      ceteraUtils.autocompleteQuery(searchTerm, translatedFilters).
        then(callback);
    }
  }

  renderTopbar() {
    const {
      activeTab,
      additionalTopbarComponents,
      allFilters,
      changeQ,
      clearSearch,
      currentQuery,
      isMobile,
      onClose,
      page,
      renderStyle,
      selectMode,
      showBackButton,
      showFilters,
      showManageAssets,
      showSearchField,
      tabs,
      toggleFilters,
      viewingOwnProfile
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
      buttonStyle: true,
      clearSearch,
      showTitle: false
    };

    const allAssetsButtonTitle = viewingOwnProfile ?
      I18n.t('view_all', { scope }) :
      I18n.t('view_user_assets', { scope, userName: _.get(window, 'socrata.assetBrowser.staticData.targetUserDisplayName') });

    const assetUrl = viewingOwnProfile ?
      `/admin/assets?tab=${constants.MY_ASSETS_TAB}` :
      `/admin/assets?tab=${constants.MY_ASSETS_TAB}&` +
      `ownerId=${socrata.assetBrowser.staticData.targetUserId}&` +
      `ownerName=${escape(socrata.assetBrowser.staticData.targetUserDisplayName)}`;

    const allAssetsButton = showManageAssets ? (
      <div className="manage-assets-link">
        <a href={assetUrl}>
          <button className="btn btn-primary all-assets-button">
            {allAssetsButtonTitle}
            <SocrataIcon name="arrow-right" />
          </button>
        </a>
      </div>
    ) : null;

    const mobileFilterToggle = isMobile && showFilters ? (
      <a href="#" className="mobile-filter-toggle" onClick={toggleFilters}>
        {I18n.t('mobile.filters', { scope })}
        <ActiveFilterCount />
        <SocrataIcon name="arrow-right" />
      </a>
    ) : null;

    const clearFiltersButton = (isMobile || !showFilters) ? null : <ClearFilters {...clearFiltersProps} />;

    const topbarClassnames = classNames(
      'topbar clearfix',
      {
        'cards-container-topbar': renderStyle === 'card',
        mobile: isMobile
      }
    );

    const sortDropdown = (renderStyle === 'card') ? <SortDropdown /> : null;

    const searchField = showSearchField ?
      <Autocomplete {...autocompleteOptions} className="autocomplete" /> : null;

    const backButton = (selectMode === true && showBackButton === true) ? <BackButton onClick={onClose} /> : null;

    return (
      <div className={topbarClassnames}>
        {mobileFilterToggle}
        {backButton}
        {additionalTopbarComponents}
        {searchField}
        {sortDropdown}
        {clearFiltersButton}
        {allAssetsButton}
      </div>
    );
  }

  renderResults() {
    const { actionElement, closeOnSelect, fetchingResults, onAssetSelected, onClose, renderStyle } = this.props;

    const spinner = fetchingResults ? (
      <div className="catalog-results-spinner-container">
        <span className="spinner-default spinner-large"></span>
      </div>
    ) : null;

    let resultListing;
    let resultListingProps;

    if (renderStyle === 'card') {
      resultListing = ResultCardContainer;
      resultListingProps = {
        closeOnSelect,
        onAssetSelected,
        onClose
      };
    } else {
      resultListing = ResultListTable;
      resultListingProps = {
        actionElement
      };
    }

    return (
      <div className="table-wrapper">
        {React.createElement(resultListing, resultListingProps)}
        {spinner}
      </div>
    );
  }

  // EN-18329: Hide the Asset Inventory button when on "My Assets" or "Shared to Me" tabs.
  showAssetInventoryLink() {
    const { activeTab, enableAssetInventoryLink } = this.props;
    return enableAssetInventoryLink &&
      activeTab !== constants.MY_ASSETS_TAB &&
      activeTab !== constants.SHARED_TO_ME_TAB;
  }

  renderFooter() {
    const {
      activeTab,
      fetchingResults,
      pageNumber,
      pageSize,
      resultSetSize,
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

    const renderedAssetInventoryLink = this.showAssetInventoryLink() ? (
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
    // TODO: When this expression get any longer, convert to .any() or .all() style.
    if (!showPager && !this.showAssetInventoryLink()) {
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
    const { showPager } = this.props;

    const catalogResultsClassnames = classNames('catalog-results', {
      'mobile': this.props.isMobile,
      'footerless': !showPager && !this.showAssetInventoryLink()
    });

    return (
      <div className={catalogResultsClassnames}>
        {this.renderTopbar()}
        {this.renderError()}
        {this.renderResults()}
        {this.renderFooter()}
      </div>
    );
  }
}

CatalogResults.propTypes = {
  actionElement: PropTypes.func,
  activeTab: PropTypes.string.isRequired,
  additionalTopbarComponents: PropTypes.array,
  allFilters: PropTypes.object,
  changePage: PropTypes.func.isRequired,
  changeQ: PropTypes.func.isRequired,
  clearSearch: PropTypes.func,
  currentQuery: PropTypes.string,
  enableAssetInventoryLink: PropTypes.bool,
  fetchInitialResults: PropTypes.func.isRequired,
  fetchingResults: PropTypes.bool,
  fetchingResultsError: PropTypes.bool,
  fetchingResultsErrorType: PropTypes.string,
  initialResultsFetched: PropTypes.bool.isRequired,
  isMobile: PropTypes.bool.isRequired,
  onAssetSelected: PropTypes.func,
  onClose: PropTypes.func,
  order: PropTypes.object,
  page: PropTypes.string,
  pageNumber: PropTypes.number,
  pageSize: PropTypes.number,
  resultSetSize: PropTypes.number.isRequired,
  showBackButton: PropTypes.bool,
  tabs: PropTypes.object.isRequired,
  toggleFilters: PropTypes.func.isRequired,
  updatePageSize: PropTypes.func.isRequired,
  viewingOwnProfile: PropTypes.bool
};

CatalogResults.defaultProps = {
  actionElement: ActionDropdown,
  additionalTopbarComponents: [],
  allFilters: {},
  currentQuery: '',
  fetchingResults: false,
  fetchingResultsError: false,
  initialResultsFetched: false,
  onClose: _.noop,
  pageNumber: 1,
  pageSize: DEFAULT_RESULTS_PER_PAGE,
  showBackButton: true,
  viewingOwnProfile: true
};

const mapStateToProps = (state) => ({
  activeTab: state.header.activeTab,
  allFilters: state.filters,
  currentQuery: state.filters.q,
  fetchingResults: state.catalog.fetchingResults,
  fetchingResultsError: state.catalog.fetchingResultsError,
  fetchingResultsErrorType: state.catalog.fetchingResultsErrorType,
  initialResultsFetched: state.catalog.initialResultsFetched,
  isMobile: state.windowDimensions.isMobile,
  order: state.catalog.order,
  pageNumber: state.catalog.pageNumber,
  reduxState: state,
  resultSetSize: state.catalog.resultSetSize,
  tabs: state.assetBrowserProps.tabs
});

const mapDispatchToProps = (dispatch) => ({
  changePage: (pageNumber) => dispatch(pager.changePage(pageNumber)),
  changeQ: (query) => dispatch(filters.changeQ(query)),
  clearSearch: () => dispatch(filters.clearSearch()),
  fetchInitialResults: (parameters) => dispatch(ceteraHelpers.fetchInitialResults(parameters)),
  toggleFilters: () => dispatch(mobile.toggleFilters()),
  updatePageSize: (pageSize) => dispatch(pageSizeActions.updatePageSize(pageSize))
});

export default connect(mapStateToProps, mapDispatchToProps)(CatalogResults);
