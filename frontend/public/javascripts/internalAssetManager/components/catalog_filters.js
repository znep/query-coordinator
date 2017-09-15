import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import classNames from 'classnames';
import { handleEnter } from 'common/helpers/keyPressHelpers';
import { Dropdown } from 'common/components';
import SearchboxFilter from './filters/searchbox_filter';
import * as filterOptions from '../lib/catalog_filter_options';
import * as filters from '../actions/filters';
import ClearFilters from './clear_filters';
import { FeatureFlags } from 'common/feature_flags';
import connectLocalization from 'common/i18n/components/connectLocalization';

export class CatalogFilters extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      filterContentOpen: true
    };

    _.bindAll(this,
      'handleFilterContentToggleClick',
      'renderFilterCheckbox',
      'renderFilterDropdown'
    );
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
        size="medium"
        value={value || null} />
    );
  }

  render() {
    const {
      activeTab,
      allFilters,
      assetTypes,
      authority,
      category,
      changeAssetType,
      changeAuthority,
      changeCategory,
      changeCustomFacet,
      changeOwner,
      changeTag,
      changeVisibility,
      clearAllFilters,
      customFacets,
      domainCategories,
      domainCustomFacets,
      domainTags,
      I18n,
      onlyRecentlyViewed,
      ownedBy,
      tag,
      toggleRecentlyViewed,
      usersList,
      visibility
    } = this.props;

    const { filterContentOpen } = this.state;

    const filterContentClass = classNames('filter-content', { hidden: !filterContentOpen });

    const openFiltersButton = !filterContentOpen ?
      <button
        className="open-filters filter-content-toggle"
        onClick={this.handleFilterContentToggleClick}
        onKeyDown={handleEnter(this.handleFilterContentToggleClick, true)}>
        <span
          aria-label={I18n.t('internal_asset_manager.filters.mobile.expand')}
          className="socrata-icon-arrow-left"
          title={I18n.t('internal_asset_manager.filters.mobile.expand')} />
      </button> : null;

    const closeFiltersButton = filterContentOpen ?
      <button
        className="close-filters filter-content-toggle"
        onClick={this.handleFilterContentToggleClick}
        onKeyDown={handleEnter(this.handleFilterContentToggleClick, true)}>
        {I18n.t('internal_asset_manager.filters.mobile.hide')}
        <span
          aria-label={I18n.t('internal_asset_manager.filters.mobile.contract')}
          className="socrata-icon-arrow-right"
          title={I18n.t('internal_asset_manager.filters.mobile.contract')} />
      </button> : null;

    const filterHeader = (
      <div className="catalog-filters-header">
        <ClearFilters {...this.props} allFilters={allFilters} clearAllFilters={clearAllFilters} />
        {closeFiltersButton}
      </div>
    );

    const recentlyViewedFilterSection = (
      <div className="filter-section recently-viewed">
        {this.renderFilterCheckbox({
          inputId: 'filter-recently-viewed',
          labelText: I18n.t('internal_asset_manager.filters.recently_viewed.label'),
          isChecked: onlyRecentlyViewed,
          onChange: toggleRecentlyViewed
        })}
      </div>
    );

    let assetTypeOptions = filterOptions.assetTypeOptions;
    if (!FeatureFlags.value('stories_enabled')) {
      assetTypeOptions = _.reject(assetTypeOptions, (option) => option.value === 'stories');
    }

    const assetTypesFilterSection = (
      <div className="filter-section asset-types">
        <label className="filter-label">{I18n.t('internal_asset_manager.filters.asset_types.label')}</label>
        {this.renderFilterDropdown({
          options: assetTypeOptions,
          value: assetTypes,
          onChange: changeAssetType
        })}
      </div>
    );

    const authorityFilterSection = activeTab === 'myAssets' ? null : (
      <div className="filter-section authority">
        <label className="filter-label">{I18n.t('internal_asset_manager.filters.authority.label')}</label>
        {this.renderFilterDropdown({
          options: filterOptions.authorityOptions,
          value: authority,
          onChange: changeAuthority
        })}
      </div>
    );

    const ownedByFilterSection = activeTab === 'myAssets' ? null : (
      <div className="filter-section owned-by">
        <label className="filter-label">
          {I18n.t('internal_asset_manager.filters.owned_by.label')}
        </label>
        <SearchboxFilter
          inputId="owned-by-filter"
          options={_.map(usersList, (user) => ({ title: user.displayName, value: user.id }))}
          onSelection={changeOwner}
          placeholder={I18n.t('internal_asset_manager.filters.owned_by.placeholder')}
          value={ownedBy.displayName} />
      </div>
    );

    const visibilityFilterSection = (
      <div className="filter-section visibility">
        <label className="filter-label">{I18n.t('internal_asset_manager.filters.visibility.label')}</label>
        {this.renderFilterDropdown({
          options: filterOptions.visibilityOptions,
          value: visibility,
          onChange: changeVisibility
        })}
      </div>
    );

    const categoryFilterSection = (
      <div className="filter-section category">
        <label className="filter-label">
          {I18n.t('internal_asset_manager.filters.category.label')}
        </label>
        <SearchboxFilter
          inputId="category-filter"
          options={_.map(domainCategories, (curCategory) => ({ title: curCategory, value: curCategory }))}
          onSelection={changeCategory}
          placeholder={I18n.t('internal_asset_manager.filters.category.placeholder')}
          value={category} />
      </div>
    );

    const tagsFilterSection = (
      <div className="filter-section tags">
        <label className="filter-label">
          {I18n.t('internal_asset_manager.filters.tags.label')}
        </label>
        <SearchboxFilter
          inputId="tag-filter"
          options={_.map(domainTags, (curTag) => ({ title: curTag, value: curTag }))}
          onSelection={changeTag}
          placeholder={I18n.t('internal_asset_manager.filters.tags.placeholder')}
          value={tag} />
      </div>
    );

    const renderCustomFacetFilterSections = () => (
      _.map(domainCustomFacets, (customFacet) => {
        const facetParam = customFacet.param;
        return (
          <div className="filter-section custom-facet" key={`custom-facet_${facetParam}`}>
            <label className="filter-label">{customFacet.title}</label>
            <SearchboxFilter
              inputId={`custom-filter-${facetParam}`}
              options={_.map(customFacet.options, (option) => ({ title: option.text, value: option.value }))}
              onSelection={(option) => changeCustomFacet(facetParam, option.value)}
              placeholder={I18n.t('internal_asset_manager.filters.custom_facet.placeholder')}
              value={customFacets[facetParam]} />
          </div>
        );
      })
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
            {renderCustomFacetFilterSections()}
          </form>
        </div>
      </div>
    );
  }
}

CatalogFilters.defaultProps = {
  customFacets: {}
};

CatalogFilters.propTypes = {
  activeTab: PropTypes.string.isRequired,
  allFilters: PropTypes.object,
  assetTypes: PropTypes.string,
  authority: PropTypes.string,
  category: PropTypes.string,
  changeAssetType: PropTypes.func.isRequired,
  changeAuthority: PropTypes.func.isRequired,
  changeCategory: PropTypes.func.isRequired,
  changeCustomFacet: PropTypes.func.isRequired,
  changeOwner: PropTypes.func.isRequired,
  changeTag: PropTypes.func.isRequired,
  changeVisibility: PropTypes.func.isRequired,
  clearAllFilters: PropTypes.func.isRequired,
  customFacets: PropTypes.object,
  domainCategories: PropTypes.array.isRequired,
  domainCustomFacets: PropTypes.array.isRequired,
  domainTags: PropTypes.array.isRequired,
  I18n: PropTypes.object.isRequired,
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

const mapStateToProps = (state) => ({
  activeTab: state.header.activeTab,
  allFilters: state.filters,
  assetTypes: state.filters.assetTypes,
  authority: state.filters.authority,
  category: state.filters.category,
  customFacets: state.filters.customFacets,
  domainCategories: state.filters.domainCategories,
  domainCustomFacets: state.filters.domainCustomFacets,
  domainTags: state.filters.domainTags,
  onlyRecentlyViewed: state.filters.onlyRecentlyViewed,
  ownedBy: state.filters.ownedBy,
  tag: state.filters.tag,
  usersList: state.filters.usersList,
  visibility: state.filters.visibility
});

const mapDispatchToProps = (dispatch) => ({
  changeAssetType: (value) => dispatch(filters.changeAssetType(value)),
  changeAuthority: (value) => dispatch(filters.changeAuthority(value)),
  changeCategory: (value) => dispatch(filters.changeCategory(value)),
  changeCustomFacet: (facetParam, value) => dispatch(filters.changeCustomFacet(facetParam, value)),
  changeOwner: (value) => dispatch(filters.changeOwner(value)),
  changeTag: (value) => dispatch(filters.changeTag(value)),
  changeVisibility: (value) => dispatch(filters.changeVisibility(value)),
  clearAllFilters: () => dispatch(filters.clearAllFilters()),
  toggleRecentlyViewed: () => dispatch(filters.toggleRecentlyViewed())
});

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(CatalogFilters));
