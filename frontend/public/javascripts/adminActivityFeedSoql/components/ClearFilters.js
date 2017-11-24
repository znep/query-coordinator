import _ from 'lodash';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import LocalizedText from 'common/i18n/components/LocalizedText';
import I18nJS from 'common/i18n';
import * as actions from '../actions';

class ClearFilters extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['clearAllFilters']);
  }

  clearAllFilters() {
    this.props.clearAllFilters();
  }

  renderIcon() {
    const { showTitle, filters } = this.props;

    const buttonTitle = filters.activeFilterCount > 0 ?
      I18nJS.t('screens.admin.activity_feed.filters.clear') : null;

    const filtersTitle = showTitle || filters.activeFilterCount > 0 ?
      <LocalizedText
        localeKey="screens.admin.activity_feed.filters.header.title.clear_filters_only"
        className="title" /> : null;

    const clearFiltersControls = filters.activeFilterCount > 0 ? (
      <span>
        <span className="active-filter-count">({filters.activeFilterCount})</span>
        <span
          className="filter-section clear-all-filters socrata-icon-close-circle"
          onClick={this.clearAllFilters}
          title={buttonTitle} />
      </span>
    ) : null;

    return (
      <span className="clear-filters-wrapper" title={buttonTitle}>
        {filtersTitle}
        {clearFiltersControls}
      </span>
    );
  }

  renderButton() {
    const { showTitle, filters } = this.props;

    const buttonTitle = filters.activeFilterCount > 0 ?
      I18nJS.t('screens.admin.activity_feed.filters.header.title.clear_filter_and_search')
      : null;

    const clearFiltersControls = filters.activeFilterCount > 0 ? (
      <span>
        <span
          className="filter-section clear-all-filters socrata-icon-close"
          title={buttonTitle} />
      </span>
    ) : null;

    const filtersTitle = showTitle || filters.activeFilterCount > 0 ? (
      <span className="title">
        {I18nJS.t('screens.admin.activity_feed.filters.header.title.clear_filter_and_search')}
      </span>
    ) : null;

    return (
      <span
        className="clear-filters-wrapper button"
        onClick={this.clearAllFilters}
        title={buttonTitle}>
        {filtersTitle}
        {clearFiltersControls}
      </span>
    );
  }

  render() {
    const { buttonStyle, showTitle, filters } = this.props;

    if (!showTitle && filters.activeFilterCount <= 0) {
      return null;
    }

    if (buttonStyle) {
      return this.renderButton();
    } else {
      return this.renderIcon();
    }
  }
}

ClearFilters.propTypes = {
  buttonStyle: PropTypes.bool,
  showTitle: PropTypes.bool
};

ClearFilters.defaultProps = {
  buttonStyle: false,
  showTitle: true
};

const mapStateToProps = (state) => ({
  filters: state.filters
});

const mapDispatchToProps = (dispatch) => ({
  clearAllFilters: (shouldClearSearch) => dispatch(actions.filters.clearAllFilters(shouldClearSearch))
});

export default connect(mapStateToProps, mapDispatchToProps)(ClearFilters);
