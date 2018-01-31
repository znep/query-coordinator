import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import I18n from 'common/i18n';
import * as constants from 'common/components/AssetBrowser/lib/constants.js';
import SocrataIcon from 'common/components/SocrataIcon';
import Modal, { ModalHeader, ModalContent, ModalFooter } from 'common/components/Modal';

import ActiveFilterCount from './active_filter_count';
import AssetTypesFilter from './asset_types_filter';
import AuthorityFilter from './authority_filter';
import CategoryFilter from './category_filter';
import CustomFacetFilters from './custom_facet_filters';
import OwnedByFilter from './owned_by_filter';
import RecentlyViewedFilter from './recently_viewed_filter';
import AwaitingApprovalFilter from './awaiting_approval_filter';
import TagFilter from './tag_filter';
import VisibilityFilter from './visibility_filter';

import * as filters from 'common/components/AssetBrowser/actions/filters';
import * as mobile from 'common/components/AssetBrowser/actions/mobile';

export class MobileCatalogFilters extends Component {
  render() {
    const {
      activeTab,
      clearAllFilters,
      filtersOpen,
      showAwaitingApprovalFilter,
      toggleFilters
    } = this.props;

    const filterHeader = (
      <div className="catalog-filters-header">
        {I18n.t('shared.asset_browser.mobile.filters')} <ActiveFilterCount />
        <a href="#" onClick={toggleFilters} className="done-button">
          {I18n.t('shared.asset_browser.mobile.done')}
        </a>
      </div>
    );

    /**
      Keep the following logic in sync with ./catalog_filters
      TODO: use a helper for this logic that both files can share
    **/
    const onMyAssetsTab = activeTab === constants.MY_ASSETS_TAB;
    const onApprovals = activeTab === constants.MY_QUEUE_TAB || activeTab === constants.HISTORY_TAB;

    const authorityFilterSection = onMyAssetsTab || onApprovals ? null : <AuthorityFilter />;
    const ownedByFilterSection = onMyAssetsTab ? null : <OwnedByFilter />;
    const visibilityFilterSection = onApprovals ? null : <VisibilityFilter />;
    const awaitingApprovalFilter = showAwaitingApprovalFilter ? <AwaitingApprovalFilter /> : null;

    const modalProps = {
      className: 'catalog-filters mobile',
      fullScreen: true,
      onDismiss: toggleFilters,
      overlay: true
    };

    const clearFilters = (
      <a href="#" onClick={clearAllFilters} className="reset-filters">
        <SocrataIcon name="close-circle" />
        {I18n.t('shared.asset_browser.mobile.reset_filters')}
      </a>
    );

    return (filtersOpen ? (
      <Modal {...modalProps}>
        <ModalHeader onDismiss={toggleFilters} showCloseButton={false}>
          {filterHeader}
        </ModalHeader>
        <ModalContent>
          <div className="filter-content">
            <form>
              <RecentlyViewedFilter />
              {awaitingApprovalFilter}
              <AssetTypesFilter />
              {authorityFilterSection}
              {ownedByFilterSection}
              {visibilityFilterSection}
              <CategoryFilter />
              <TagFilter />
              <CustomFacetFilters />
            </form>
          </div>
        </ModalContent>
        <ModalFooter>
          {clearFilters}
          <button className="btn btn-default" onClick={toggleFilters}>
            {I18n.t('shared.asset_browser.mobile.done')}
          </button>
        </ModalFooter>
      </Modal>
    ) : null);
  }
}

MobileCatalogFilters.propTypes = {
  activeTab: PropTypes.string.isRequired,
  clearAllFilters: PropTypes.func.isRequired,
  filtersOpen: PropTypes.bool.isRequired,
  toggleFilters: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  activeTab: state.header.activeTab,
  filtersOpen: state.mobile.filtersOpen
});

const mapDispatchToProps = (dispatch) => ({
  clearAllFilters: () => dispatch(filters.clearAllFilters(true)),
  toggleFilters: () => dispatch(mobile.toggleFilters())
});

export default connect(mapStateToProps, mapDispatchToProps)(MobileCatalogFilters);
