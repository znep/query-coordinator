import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import classNames from 'classnames';
import { handleEnter } from 'common/helpers/keyPressHelpers';
import connectLocalization from 'common/i18n/components/connectLocalization';

import ClearFilters from './clear_filters';
import AssetTypesFilter from './filters/asset_types_filter';
import AuthorityFilter from './filters/authority_filter';
import CategoryFilter from './filters/category_filter';
import CustomFacetFilters from './filters/custom_facet_filters';
import OwnedByFilter from './filters/owned_by_filter';
import RecentlyViewedFilter from './filters/recently_viewed_filter';
import TagFilter from './filters/tag_filter';
import VisibilityFilter from './filters/visibility_filter';

import * as filters from '../actions/filters';

export class CatalogFilters extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      filterContentOpen: true
    };

    _.bindAll(this,
      'handleFilterContentToggleClick'
    );
  }

  handleFilterContentToggleClick() {
    this.setState({ filterContentOpen: !this.state.filterContentOpen });
  }

  render() {
    const { activeTab, allFilters, clearAllFilters, I18n } =
      this.props;

    const { filterContentOpen } = this.state;

    const filterContentClass = classNames('filter-content', { hidden: !filterContentOpen });

    const openFiltersButton = !filterContentOpen ?
      <button
        className="open-filters filter-content-toggle"
        onClick={this.handleFilterContentToggleClick}
        onKeyDown={handleEnter(this.handleFilterContentToggleClick, true)}>
        <span
          aria-label={I18n.t('internal_asset_manager.filters.desktop.expand')}
          className="socrata-icon-arrow-left"
          title={I18n.t('internal_asset_manager.filters.desktop.expand')} />
      </button> : null;

    const closeFiltersButton = filterContentOpen ?
      <button
        className="close-filters filter-content-toggle"
        onClick={this.handleFilterContentToggleClick}
        onKeyDown={handleEnter(this.handleFilterContentToggleClick, true)}>
        {I18n.t('internal_asset_manager.filters.desktop.hide')}
        <span
          aria-label={I18n.t('internal_asset_manager.filters.desktop.contract')}
          className="socrata-icon-arrow-right"
          title={I18n.t('internal_asset_manager.filters.desktop.contract')} />
      </button> : null;

    const filterHeader = (
      <div className="catalog-filters-header">
        <ClearFilters allFilters={allFilters} clearAllFilters={clearAllFilters} />
        {closeFiltersButton}
      </div>
    );

    const onMyAssetsTab = activeTab === 'myAssets';
    const authorityFilterSection = onMyAssetsTab ? null : <AuthorityFilter />;
    const ownedByFilterSection = onMyAssetsTab ? null : <OwnedByFilter />;

    return (
      <div className="catalog-filters">
        {openFiltersButton}

        <div className={filterContentClass}>
          {filterHeader}
          <form>
            <RecentlyViewedFilter />
            <AssetTypesFilter />
            {authorityFilterSection}
            {ownedByFilterSection}
            <VisibilityFilter />
            <CategoryFilter />
            <TagFilter />
            <CustomFacetFilters />
          </form>
        </div>
      </div>
    );
  }
}

CatalogFilters.propTypes = {
  activeTab: PropTypes.string.isRequired,
  allFilters: PropTypes.object,
  clearAllFilters: PropTypes.func.isRequired,
  I18n: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  activeTab: state.header.activeTab,
  allFilters: state.filters
});

const mapDispatchToProps = (dispatch) => ({
  clearAllFilters: () => dispatch(filters.clearAllFilters())
});

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(CatalogFilters));
