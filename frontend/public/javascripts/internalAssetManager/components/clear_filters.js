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

    // =(
    document.querySelector('.autocomplete-input').value = '';
  }

  render() {
    const { buttonStyle, clearAllFilters, showTitle } = this.props;

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
