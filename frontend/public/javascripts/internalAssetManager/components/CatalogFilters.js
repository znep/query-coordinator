import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import { Dropdown } from 'socrata-components';
import SearchboxFilter from './filters/SearchboxFilter';
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
      <div className="checkbox checkbox-filter">
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
    const { assetTypes, authority, category, changeAssetType, changeAuthority, changeCategory, changeOwner,
      changeTag, changeVisibility, domainCategories, domainTags, onlyRecentlyViewed, ownedBy, tag,
      toggleRecentlyViewed, usersList, visibility } = this.props;

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

    const authorityFilterSection = (
      <div className="filter-section authority">
        <label className="filter-label">{this.getTranslation('authority.label')}</label>
        {this.renderFilterDropdown({
          options: filterOptions.authorityOptions,
          value: authority,
          onChange: changeAuthority
        })}
      </div>
    );

    const ownedByFilterSection = (
      <div className="filter-section owned-by">
        <label className="filter-label">{this.getTranslation('owned_by.label')}</label>
        <SearchboxFilter
          options={_.map(usersList, (user) => ({ title: user.displayName, value: user.id }))}
          onSelection={changeOwner}
          placeholder={this.getTranslation('owned_by.placeholder')}
          value={ownedBy.displayName} />
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

    const categoryFilterSection = (
      <div className="filter-section category">
        <label className="filter-label">{this.getTranslation('category.label')}</label>
        <SearchboxFilter
          options={_.map(domainCategories, (curCategory) => ({ title: curCategory, value: curCategory }))}
          onSelection={changeCategory}
          placeholder={this.getTranslation('category.placeholder')}
          value={category} />
      </div>
    );

    const tagsFilterSection = (
      <div className="filter-section tags">
        <label className="filter-label">{this.getTranslation('tags.label')}</label>
        <SearchboxFilter
          options={_.map(domainTags, (curTag) => ({ title: curTag, value: curTag }))}
          onSelection={changeTag}
          placeholder={this.getTranslation('tags.placeholder')}
          value={tag} />
      </div>
    );

    return (
      <div className="catalog-filters">
        {filterHeader}
        <form>
          {recentlyViewedFilterSection}
          {assetTypesFilterSection}
          {authorityFilterSection}
          {ownedByFilterSection}
          {visibilityFilterSection}
          {categoryFilterSection}
          {tagsFilterSection}
        </form>
      </div>
    );
  }
}

CatalogFilters.propTypes = {
  assetTypes: PropTypes.string,
  authority: PropTypes.string,
  category: PropTypes.string,
  changeAssetType: PropTypes.func.isRequired,
  changeAuthority: PropTypes.func.isRequired,
  changeCategory: PropTypes.func.isRequired,
  changeOwner: PropTypes.func.isRequired,
  changeTag: PropTypes.func.isRequired,
  changeVisibility: PropTypes.func.isRequired,
  domainCategories: PropTypes.array.isRequired,
  domainTags: PropTypes.array.isRequired,
  onlyRecentlyViewed: PropTypes.bool.isRequired,
  ownedBy: PropTypes.shape({
    displayName: PropTypes.string,
    id: PropTypes.string
  }),
  tag: PropTypes.string,
  toggleRecentlyViewed: PropTypes.func.isRequired,
  usersList: PropTypes.array.isRequired,
  visibility: PropTypes.string
};

const mapStateToProps = state => ({
  assetTypes: state.filters.assetTypes,
  authority: state.filters.authority,
  category: state.filters.category,
  domainCategories: state.filters.domainCategories,
  domainTags: state.filters.domainTags,
  onlyRecentlyViewed: state.filters.onlyRecentlyViewed,
  ownedBy: state.filters.ownedBy,
  tag: state.filters.tag,
  usersList: state.filters.usersList,
  visibility: state.filters.visibility
});

const mapDispatchToProps = dispatch => ({
  changeAssetType: (value) => dispatch(actions.changeAssetType(value)),
  changeAuthority: (value) => dispatch(actions.changeAuthority(value)),
  changeCategory: (value) => dispatch(actions.changeCategory(value)),
  changeOwner: (value) => dispatch(actions.changeOwner(value)),
  changeTag: (value) => dispatch(actions.changeTag(value)),
  changeVisibility: (value) => dispatch(actions.changeVisibility(value)),
  toggleRecentlyViewed: () => dispatch(actions.toggleRecentlyViewed())
});

export default connect(mapStateToProps, mapDispatchToProps)(CatalogFilters);
