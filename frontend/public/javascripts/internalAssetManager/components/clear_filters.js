import React, { Component, PropTypes } from 'react';
import _ from 'lodash';

export class ClearFilters extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, 'activeFilters', 'clearAllFiltersAndQuery');
  }

  activeFilters() {
    return _.map(
      _(['assetTypes', 'authority', 'category', 'onlyRecentlyViewed', 'ownedBy.id', 'q', 'tag',
        'visibility']).map((assetType) => _.get(this.props.allFilters, assetType)).compact().value()
    );
  }

  clearAllFiltersAndQuery() {
    this.props.clearAllFilters();

    // EN-17287: As of now, Autocomplete search has its own Redux store to manage its state. We want to
    // essentially dispatch the `searchCleared` autocomplete action, and unfortunately there does not seem
    // to be a good way to do that without a more significant refactor. For now, we simply query for the
    // autocomplete input and manually set its value to an empty string.
    // For more information, see: https://github.com/socrata/platform-ui/pull/5176
    if (document.querySelector('.internal-asset-manager .autocomplete-input')) {
      document.querySelector('.internal-asset-manager .autocomplete-input').value = '';
    }
  }

  render() {
    const { buttonStyle, showTitle } = this.props;

    if (!showTitle && this.activeFilters().length <= 0) {
      return null;
    }

    const iconClass = buttonStyle ? 'socrata-icon-close' : 'socrata-icon-close-circle';

    const wrapperClass = buttonStyle ? 'clear-filters-wrapper button' : 'clear-filters-wrapper';

    const handleIconOnClick = buttonStyle ? null : this.clearAllFiltersAndQuery;

    const handleButtonOnClick = buttonStyle ? this.clearAllFiltersAndQuery : null;

    const clearFiltersControls = this.activeFilters().length > 0 ?
      <span>
        <span className="filter-count">({this.activeFilters().length})</span>
        <span
          className={`filter-section clear-all-filters ${iconClass}`}
          onClick={handleIconOnClick}
          title={_.get(I18n, 'filters.clear')} />
      </span> : null;

    const filtersTitle = showTitle || this.activeFilters().length > 0 ?
      <span className="title">
        {_.get(I18n, 'filters.header.title')}
      </span> : null;

    return (
      <span className={wrapperClass} onClick={handleButtonOnClick} title={_.get(I18n, 'filters.clear')}>
        {filtersTitle}
        {clearFiltersControls}
      </span>
    );
  }
}

ClearFilters.propTypes = {
  allFilters: PropTypes.object,
  buttonStyle: PropTypes.bool,
  clearAllFilters: PropTypes.func.isRequired,
  showTitle: PropTypes.bool
};

ClearFilters.defaultProps = {
  buttonStyle: false,
  showTitle: true
};

export default ClearFilters;
