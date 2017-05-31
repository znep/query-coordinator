import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import { Dropdown } from 'socrata-components';
import * as filterOptions from '../lib/catalogFilterOptions';
import * as actions from '../actions/filters';

export class CatalogFilters extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'getTranslation',
      'renderFilterCheckbox',
      'renderFilterDropdown'
    ]);
  }

  getTranslation(key) {
    return _.get(I18n, `filters.${key}`);
  }

  renderFilterCheckbox({ inputId, labelText, isChecked, onChange }) {
    return (
      <div className="checkbox">
        <input id={inputId} type="checkbox" onChange={onChange} checked={isChecked} />
        <label htmlFor={inputId}>
          <span className="fake-checkbox"><span className="socrata-icon-checkmark3"></span></span>
          {labelText}
        </label>
      </div>
    );
  }

  renderFilterDropdown({ options, value, onChange }) {
    return (
      <Dropdown
        onSelection={(option) => onChange(option.value)}
        options={options}
        value={value} />
    );
  }

  render() {
    const { assetTypes, changeAssetType, changeLastUpdatedDate, changeVisibility, lastUpdatedDate,
      onlyRecentlyViewed, visibility, toggleRecentlyViewed } = this.props;

    const filterHeader = (
      <div className="catalog-filters-header">
        <span className="title">{this.getTranslation('header.title')}</span>
      </div>
    );

    const recentlyViewedFilterSection = (
      <div className="filter-section recently-viewed">
        {this.renderFilterCheckbox({
          inputId: 'filter-recently-viewed',
          labelText: this.getTranslation('recently_viewed.label'),
          isChecked: onlyRecentlyViewed,
          onChange: toggleRecentlyViewed
        })}
      </div>
    );

    const lastUpdatedDateFilterSection = (
      <div className="filter-section last-updated-date">
        <label className="filter-label">{this.getTranslation('last_updated_date.label')}</label>
        {this.renderFilterDropdown({
          options: filterOptions.lastUpdatedDateOptions,
          value: lastUpdatedDate,
          onChange: changeLastUpdatedDate
        })}
      </div>
    );

    const assetTypesFilterSection = (
      <div className="filter-section asset-types">
        <label className="filter-label">{this.getTranslation('asset_types.label')}</label>
        {this.renderFilterDropdown({
          options: filterOptions.assetTypeOptions,
          value: assetTypes,
          onChange: changeAssetType
        })}
      </div>
    );

    const visibilityFilterSection = (
      <div className="filter-section visibility">
        <label className="filter-label">{this.getTranslation('visibility.label')}</label>
        {this.renderFilterDropdown({
          options: filterOptions.visibilityOptions,
          value: visibility,
          onChange: changeVisibility
        })}
      </div>
    );

    return (
      <div className="catalog-filters">
        {filterHeader}
        <form>
          {recentlyViewedFilterSection}
          {lastUpdatedDateFilterSection}
          {assetTypesFilterSection}
          {visibilityFilterSection}
        </form>
      </div>
    );
  }
}

CatalogFilters.propTypes = {
  assetTypes: PropTypes.string,
  changeAssetType: PropTypes.func.isRequired,
  changeLastUpdatedDate: PropTypes.func.isRequired,
  changeVisibility: PropTypes.func.isRequired,
  lastUpdatedDate: PropTypes.string.isRequired,
  onlyRecentlyViewed: PropTypes.bool.isRequired,
  toggleRecentlyViewed: PropTypes.func.isRequired,
  visibility: PropTypes.string
};

const mapStateToProps = state => ({
  assetTypes: state.filters.assetTypes,
  lastUpdatedDate: state.filters.lastUpdatedDate,
  onlyRecentlyViewed: state.filters.onlyRecentlyViewed,
  visibility: state.filters.visibility
});

const mapDispatchToProps = dispatch => ({
  changeAssetType: (value) => dispatch(actions.changeAssetType(value)),
  changeLastUpdatedDate: (value) => dispatch(actions.changeLastUpdatedDate(value)),
  changeVisibility: (value) => dispatch(actions.changeVisibility(value)),
  toggleRecentlyViewed: () => dispatch(actions.toggleRecentlyViewed())
});

export default connect(mapStateToProps, mapDispatchToProps)(CatalogFilters);
