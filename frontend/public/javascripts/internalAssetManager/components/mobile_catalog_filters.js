import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import connectLocalization from 'common/i18n/components/connectLocalization';
import SocrataIcon from 'common/components/SocrataIcon';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';

import ActiveFilterCount from './active_filter_count';
import AssetTypesFilter from './filters/asset_types_filter';
import AuthorityFilter from './filters/authority_filter';
import CategoryFilter from './filters/category_filter';
import CustomFacetFilters from './filters/custom_facet_filters';
import OwnedByFilter from './filters/owned_by_filter';
import RecentlyViewedFilter from './filters/recently_viewed_filter';
import TagFilter from './filters/tag_filter';
import VisibilityFilter from './filters/visibility_filter';

import * as filters from '../actions/filters';
import * as mobile from '../actions/mobile';

export class MobileCatalogFilters extends React.Component {
  render() {
    const {
      activeTab,
      clearAllFilters,
      filtersOpen,
      I18n,
      toggleFilters
    } = this.props;

    const filterHeader = (
      <div className="catalog-filters-header">
        {I18n.t('internal_asset_manager.mobile.filters')} <ActiveFilterCount />
        <a href="#" onClick={toggleFilters} className="done-button">
          {I18n.t('internal_asset_manager.mobile.done')}
        </a>
      </div>
    );

    const onMyAssetsTab = activeTab === 'myAssets';
    const authorityFilterSection = onMyAssetsTab ? null : <AuthorityFilter />;
    const ownedByFilterSection = onMyAssetsTab ? null : <OwnedByFilter />;

    const modalProps = {
      className: 'catalog-filters mobile',
      fullScreen: true,
      onDismiss: toggleFilters,
      overlay: true
    };

    const clearFilters = (
      <a href="#" onClick={clearAllFilters} className="reset-filters">
        <SocrataIcon name="close-circle" />
        {I18n.t('internal_asset_manager.mobile.reset_filters')}
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
              <AssetTypesFilter />
              {authorityFilterSection}
              {ownedByFilterSection}
              <VisibilityFilter />
              <CategoryFilter />
              <TagFilter />
              <CustomFacetFilters />
            </form>
          </div>
        </ModalContent>
        <ModalFooter>
          {clearFilters}
          <button className="btn btn-default" onClick={toggleFilters}>
            {I18n.t('internal_asset_manager.mobile.done')}
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
  I18n: PropTypes.object.isRequired,
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

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(MobileCatalogFilters));

