import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { handleEnter } from 'common/dom_helpers/keyPressHelpers';
import * as filterActions from 'common/components/AssetBrowser/actions/filters';
import I18n from 'common/i18n';

import ClearFilters from './clear_filters';
import AssetTypesFilter from './asset_types_filter';
import AuthorityFilter from './authority_filter';
import CategoryFilter from './category_filter';
import CustomFacetFilters from './custom_facet_filters';
import OwnedByFilter from './owned_by_filter';
import RecentlyViewedFilter from './recently_viewed_filter';
import TagFilter from './tag_filter';
import VisibilityFilter from './visibility_filter';

export class CatalogFilters extends Component {
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
    const { activeTab, allFilters, clearAllFilters } = this.props;

    const { filterContentOpen } = this.state;

    const filterContentClass = classNames('filter-content', { hidden: !filterContentOpen });

    const openFiltersButton = !filterContentOpen ?
      <button
        className="open-filters filter-content-toggle"
        onClick={this.handleFilterContentToggleClick}
        onKeyDown={handleEnter(this.handleFilterContentToggleClick, true)}>
        <span
          aria-label={I18n.t('shared.asset_browser.filters.desktop.expand')}
          className="socrata-icon-arrow-left"
          title={I18n.t('shared.asset_browser.filters.desktop.expand')} />
      </button> : null;

    const closeFiltersButton = filterContentOpen ?
      <button
        className="close-filters filter-content-toggle"
        onClick={this.handleFilterContentToggleClick}
        onKeyDown={handleEnter(this.handleFilterContentToggleClick, true)}>
        {I18n.t('shared.asset_browser.filters.desktop.hide')}
        <span
          aria-label={I18n.t('shared.asset_browser.filters.desktop.contract')}
          className="socrata-icon-arrow-right"
          title={I18n.t('shared.asset_browser.filters.desktop.contract')} />
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
  allFilters: PropTypes.object,
  clearAllFilters: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  activeTab: state.header.activeTab,
  allFilters: state.filters
});

const mapDispatchToProps = (dispatch) => ({
  clearAllFilters: () => dispatch(filterActions.clearAllFilters())
});

export default connect(mapStateToProps, mapDispatchToProps)(CatalogFilters);
