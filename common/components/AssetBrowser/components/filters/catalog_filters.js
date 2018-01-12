import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { handleEnter } from 'common/dom_helpers/keyPressHelpers';
import I18n from 'common/i18n';
import * as constants from 'common/components/AssetBrowser/lib/constants.js';

import ClearFilters from './clear_filters';
import AssetTypesFilter from './asset_types_filter';
import AuthorityFilter from './authority_filter';
import CategoryFilter from './category_filter';
import CustomFacetFilters from './custom_facet_filters';
import OwnedByFilter from './owned_by_filter';
import RecentlyViewedFilter from './recently_viewed_filter';
import AwaitingApprovalFilter from './awaiting_approval_filter';
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
    const { activeTab, showAwaitingApprovalFilter } = this.props;

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
        <ClearFilters />
        {closeFiltersButton}
      </div>
    );

    const onMyAssetsTab = activeTab === constants.MY_ASSETS_TAB;
    const onApprovals = activeTab === constants.MY_QUEUE_TAB || activeTab === constants.HISTORY_TAB;

    const authorityFilterSection = onMyAssetsTab ? null : <AuthorityFilter />;
    const ownedByFilterSection = onMyAssetsTab ? null : <OwnedByFilter />;
    const visibilityFilterSection = onApprovals ? null : <VisibilityFilter />;

    return (
      <div className="catalog-filters">
        {openFiltersButton}

        <div className={filterContentClass}>
          {filterHeader}
          <form>
            <div className="filter-switches">
              <RecentlyViewedFilter />
              {showAwaitingApprovalFilter && <AwaitingApprovalFilter />}
            </div>
            <AssetTypesFilter />
            {authorityFilterSection}
            {ownedByFilterSection}
            {visibilityFilterSection}
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
  activeTab: PropTypes.string.isRequired
};

const mapStateToProps = (state) => ({
  activeTab: state.header.activeTab
});

export default connect(mapStateToProps)(CatalogFilters);
