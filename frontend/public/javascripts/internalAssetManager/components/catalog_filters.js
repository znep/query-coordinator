import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import classNames from 'classnames';
import { handleEnter } from 'common/helpers/keyPressHelpers';
import { Dropdown } from 'common/components';
import SearchboxFilter from './filters/searchbox_filter';
import * as filterOptions from '../lib/catalog_filter_options';
import * as actions from '../actions/filters';

export class CatalogFilters extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      filterContentOpen: true
    };

    _.bindAll(this, [
      'getTranslation',
      'handleFilterContentToggleClick',
      'renderFilterCheckbox',
      'renderFilterDropdown'
    ]);
  }

  getTranslation(key) {
    return _.get(I18n, `filters.${key}`);
  }

  handleFilterContentToggleClick() {
    this.setState({ filterContentOpen: !this.state.filterContentOpen });
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
      changeTag, changeVisibility, clearAllFilters, domainCategories, domainTags, onlyRecentlyViewed, ownedBy,
      tag, toggleRecentlyViewed, usersList, visibility } = this.props;

    const { filterContentOpen } = this.state;

    const filterContentClass = classNames('filter-content', {
      hidden: !filterContentOpen
    });

    const openFiltersButton = !filterContentOpen ?
      <button
        className="open-filters filter-content-toggle"
        onClick={this.handleFilterContentToggleClick}
        onKeyDown={handleEnter(this.handleFilterContentToggleClick, true)}>
        <span
          aria-label={this.getTranslation('mobile.expand')}
          className="socrata-icon-arrow-left"
          title={this.getTranslation('mobile.expand')} />
      </button> : null;

    const closeFiltersButton = filterContentOpen ?
      <button
        className="close-filters filter-content-toggle"
        onClick={this.handleFilterContentToggleClick}
        onKeyDown={handleEnter(this.handleFilterContentToggleClick, true)}>
        {this.getTranslation('mobile.hide')}
        <span
          aria-label={this.getTranslation('mobile.contract')}
          className="socrata-icon-arrow-right"
          title={this.getTranslation('mobile.contract')} />
      </button> : null;

    const filterHeader = (
      <div className="catalog-filters-header">
        <span className="title">{this.getTranslation('header.title')}
          <span
            className="filter-section clear-all-filters socrata-icon-close-circle"
            onClick={clearAllFilters}
            title={_.get(I18n, 'filters.clear_all_filters')}>
          </span>
        </span>
        {closeFiltersButton}
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
        <label className="filter-label" htmlFor="owned-by-filter">
          {this.getTranslation('owned_by.label')}
        </label>
        <SearchboxFilter
          inputId="owned-by-filter"
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
        <label className="filter-label" htmlFor="category-filter">
          {this.getTranslation('category.label')}
        </label>
        <SearchboxFilter
          inputId="category-filter"
          options={_.map(domainCategories, (curCategory) => ({ title: curCategory, value: curCategory }))}
          onSelection={changeCategory}
          placeholder={this.getTranslation('category.placeholder')}
          value={category} />
      </div>
    );

    const tagsFilterSection = (
      <div className="filter-section tags">
        <label className="filter-label" htmlFor="tag-filter">{this.getTranslation('tags.label')}</label>
        <SearchboxFilter
          inputId="tag-filter"
          options={_.map(domainTags, (curTag) => ({ title: curTag, value: curTag }))}
          onSelection={changeTag}
          placeholder={this.getTranslation('tags.placeholder')}
          value={tag} />
      </div>
    );

    return (
      <div className="catalog-filters">
        {openFiltersButton}

        <div className={filterContentClass}>
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
  clearAllFilters: PropTypes.func.isRequired,
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
  clearAllFilters: () => dispatch(actions.clearAllFilters()),
  toggleRecentlyViewed: () => dispatch(actions.toggleRecentlyViewed())
});

export default connect(mapStateToProps, mapDispatchToProps)(CatalogFilters);
