import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import I18n from 'common/i18n';
import * as filterActions from 'common/components/AssetBrowser/actions/filters';

import ActiveFilterCount from './active_filter_count';

// This export is used in platform-ui/frontend/karma/internal_asset_manager/components/clear_filters.spec.js
export class ClearFilters extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, 'activeFilters', 'activeFilterCount', 'clearAllFilters', 'clearAllFiltersAndQuery');
  }

  // See similar list of key paths in ActiveFilterCount component
  filterKeyPaths() {
    const { buttonStyle } = this.props;
    return [
      'assetTypes',
      'authority',
      'category',
      'onlyAwaitingApproval',
      'onlyRecentlyViewed',
      'ownedBy.id',
      'tag',
      'visibility',
      buttonStyle ? 'q' : null
    ].concat(this.customFacetKeyPaths());
  }

  customFacetKeyPaths() {
    const { allFilters } = this.props;
    return _.keys(
      _.get(allFilters, 'customFacets')
    ).map(
      (customFacetKey) => `customFacets.${customFacetKey}`
    );
  }

  activeFilters() {
    const { allFilters } = this.props;

    const getFilterValue = _.partial(_.get, allFilters);

    const activeFilters = {};

    _.each(this.filterKeyPaths(), (filterKey) => {
      const filterValue = getFilterValue(filterKey);
      if (filterValue) {
        activeFilters[filterKey] = filterValue;
      }
    });

    return activeFilters;
  }

  clearAllFiltersAndQuery() {
    this.props.clearAllFilters({ shouldClearSearch: true });
  }

  clearAllFilters() {
    this.props.clearAllFilters({ shouldClearSearch: false });
  }

  activeFilterCount() {
    const { activeTab, allFilters, tabs } = this.props;

    const baseFilters = _.get(tabs, `${activeTab}.props.baseFilters`) || {};

    // If baseFilters are present, don't count them among the "active" filters that the user has specified.
    if (!_.isEmpty(baseFilters)) {
      // We use _.get() here because sometimes the key is actually a key path (i.e. 'foo.bar.id')
      return _(this.filterKeyPaths()).reject((key) => _.isEmpty(_.get(allFilters, key))).
        reject((key) => _.isEqual(_.get(allFilters, key), _.get(baseFilters, key))).
        reject((key) => _.isEmpty(_.get(this.activeFilters(), key))).value().length;
    } else {
      return _.keys(this.activeFilters()).length;
    }
  }

  renderButton(showTitle) {
    const buttonTitle = this.activeFilterCount() > 0 ?
      I18n.t('shared.asset_browser.filters.header.title.clear_filter_and_search') : null;
    const hasFiltersOrQuery = this.activeFilterCount() > 0 || this.activeFilters().q;

    const clearFiltersControls = this.activeFilterCount() > 0 ?
      <span>
        <span
          className="filter-section clear-all-filters socrata-icon-close"
          title={buttonTitle} />
      </span> : null;

    const filtersTitle = showTitle || hasFiltersOrQuery ?
      <span className="title">
        {I18n.t('shared.asset_browser.filters.header.title.clear_filter_and_search')}
      </span> : null;

    return (
      <span
        className="clear-filters-wrapper button"
        onClick={this.clearAllFiltersAndQuery}
        title={buttonTitle}>
        {filtersTitle}
        {clearFiltersControls}
      </span>
    );
  }

  renderIcon(showTitle) {
    const buttonTitle = this.activeFilterCount() > 0 ? I18n.t('shared.asset_browser.filters.clear') : null;
    const hasFiltersOrQuery = this.activeFilterCount() > 0 || this.activeFilters().q;

    const clearFiltersControls = this.activeFilterCount() > 0 ?
      <span>
        <ActiveFilterCount />
        <span
          className="filter-section clear-all-filters socrata-icon-close-circle"
          onClick={this.clearAllFilters}
          title={buttonTitle} />
      </span> : null;

    const filtersTitle = showTitle || hasFiltersOrQuery ?
      <span className="title">
        {I18n.t('shared.asset_browser.filters.header.title.clear_filters_only')}
      </span> : null;

    return (
      <span className="clear-filters-wrapper" title={buttonTitle}>
        {filtersTitle}
        {clearFiltersControls}
      </span>
    );
  }

  render() {
    const { buttonStyle, showTitle } = this.props;

    if (!showTitle && this.activeFilterCount() <= 0) {
      return null;
    }

    if (buttonStyle) {
      return this.renderButton(showTitle);
    } else {
      return this.renderIcon(showTitle);
    }
  }
}

ClearFilters.propTypes = {
  activeTab: PropTypes.string.isRequired,
  allFilters: PropTypes.object.isRequired,
  buttonStyle: PropTypes.bool,
  clearAllFilters: PropTypes.func.isRequired,
  showTitle: PropTypes.bool,
  tabs: PropTypes.object.isRequired
};

ClearFilters.defaultProps = {
  buttonStyle: false,
  showTitle: true
};

const mapStateToProps = (state) => ({
  activeTab: state.header.activeTab,
  allFilters: state.filters,
  tabs: state.assetBrowserProps.tabs
});

const mapDispatchToProps = (dispatch) => ({
  clearAllFilters: (shouldClearSearch) => dispatch(filterActions.clearAllFilters(shouldClearSearch))
});

export default connect(mapStateToProps, mapDispatchToProps)(ClearFilters);
