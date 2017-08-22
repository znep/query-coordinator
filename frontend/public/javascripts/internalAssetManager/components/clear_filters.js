import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';

import connectLocalization from 'common/i18n/components/connectLocalization';

// This export is used in platform-ui/frontend/karma/internalAssetManager/components/clear_filters.spec.js
export class ClearFilters extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, 'activeFilters', 'clearAllFilters', 'clearAllFiltersAndQuery');
  }

  activeFilters() {
    const { buttonStyle, allFilters } = this.props;

    const getFilterValue = _.partial(_.get, allFilters);

    const filterKeyPaths = [
      'assetTypes',
      'authority',
      'category',
      'onlyRecentlyViewed',
      'ownedBy.id',
      'tag',
      'visibility',
      buttonStyle ? 'q' : null
    ];

    return _(filterKeyPaths).map((filter) => getFilterValue(filter)).compact().value();
  }

  clearAllFiltersAndQuery() {
    this.props.clearAllFilters(true);
  }

  clearAllFilters() {
    this.props.clearAllFilters(false);
  }

  renderButton(showTitle) {
    const { I18n } = this.props;
    const hasActiveFilters = this.activeFilters().length > 0;
    const buttonTitle = hasActiveFilters ?
      I18n.t('internal_asset_manager.filters.header.title.clear_filter_and_search') : null;
    const hasFiltersOrQuery = hasActiveFilters || this.activeFilters().q;

    const clearFiltersControls = hasActiveFilters ?
      <span>
        <span
          className="filter-section clear-all-filters socrata-icon-close"
          title={buttonTitle} />
      </span> : null;

    const filtersTitle = showTitle || hasFiltersOrQuery ?
      <span className="title">
        {I18n.t('internal_asset_manager.filters.header.title.clear_filter_and_search')}
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
    const { I18n } = this.props;
    const hasActiveFilters = this.activeFilters().length > 0;
    const buttonTitle = hasActiveFilters ? I18n.t('internal_asset_manager.filters.clear') : null;
    const hasFiltersOrQuery = hasActiveFilters || this.activeFilters().q;

    const clearFiltersControls = hasActiveFilters ?
      <span>
        <span className="filter-count">({this.activeFilters().length})</span>
        <span
          className="filter-section clear-all-filters socrata-icon-close-circle"
          onClick={this.clearAllFilters}
          title={buttonTitle} />
      </span> : null;

    const filtersTitle = showTitle || hasFiltersOrQuery ?
      <span className="title">
        {I18n.t('internal_asset_manager.filters.header.title.clear_filters_only')}
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

    if (!showTitle && this.activeFilters().length <= 0) {
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
  buttonStyle: PropTypes.bool,
  clearAllFilters: PropTypes.func.isRequired,
  I18n: PropTypes.object.isRequired,
  showTitle: PropTypes.bool
};

ClearFilters.defaultProps = {
  buttonStyle: false,
  showTitle: true
};

export default connectLocalization(connect()(ClearFilters));
