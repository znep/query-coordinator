import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import ActiveFilterCount from './active_filter_count';

import I18n from 'common/i18n';

// This export is used in platform-ui/frontend/karma/internalAssetManager/components/clear_filters.spec.js
export class ClearFilters extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, 'activeFilters', 'activeFilterCount', 'clearAllFilters', 'clearAllFiltersAndQuery');
  }

  activeFilters() {
    const { allFilters, buttonStyle } = this.props;

    const getFilterValue = _.partial(_.get, allFilters);

    const customFacetKeyPaths = _.keys(_.get(allFilters, 'customFacets')).map((customFacetKey) => (
      `customFacets.${customFacetKey}`
    ));

    const filterKeyPaths = [
      'assetTypes',
      'authority',
      'category',
      'onlyRecentlyViewed',
      'ownedBy.id',
      'tag',
      'visibility',
      buttonStyle ? 'q' : null
    ].concat(customFacetKeyPaths);

    return _(filterKeyPaths).map((filter) => getFilterValue(filter)).compact().value();
  }

  clearAllFiltersAndQuery() {
    const { clearAllFilters, baseFilters } = this.props;
    clearAllFilters({ shouldClearSearch: true, baseFilters });
  }

  clearAllFilters() {
    const { clearAllFilters, baseFilters } = this.props;
    clearAllFilters({ shouldClearSearch: false, baseFilters });
  }

  activeFilterCount() {
    const { allFilters, baseFilters } = this.props;

    // If baseFilters are present, don't count them among the "active" filters that the user has specified.
    if (!_.isEmpty(baseFilters)) {
      return _(allFilters).keys().reject((key) => _.isEmpty(allFilters[key])).
        reject((key) => _.isEqual(allFilters[key], baseFilters[key])).
        reject((key) => _.isEmpty(this.activeFilters()[key])).value().length;
    } else {
      return this.activeFilters().length;
    }
  }

  renderButton(showTitle) {
    const buttonTitle = this.activeFilterCount() > 0 ?
      I18n.t('shared.asset_browser.filters.header.title.clear_filter_and_search') : null;
    const hasFiltersOrQuery = this.activeFilterCount() > 0 || this.activeFilters().q;

    const clearFiltersControls = this.activeFilterCount()  > 0 ?
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
  allFilters: PropTypes.object,
  baseFilters: PropTypes.object,
  buttonStyle: PropTypes.bool,
  clearAllFilters: PropTypes.func.isRequired,
  showTitle: PropTypes.bool
};

ClearFilters.defaultProps = {
  allFilters: {},
  baseFilters: {},
  buttonStyle: false,
  showTitle: true
};

export default connect()(ClearFilters);
