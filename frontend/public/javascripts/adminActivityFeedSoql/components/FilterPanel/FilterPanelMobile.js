import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import I18nJS from 'common/i18n';
import SocrataIcon from 'common/components/SocrataIcon';
import Modal, { ModalHeader, ModalContent, ModalFooter } from 'common/components/Modal';

import * as actions from '../../actions';
import AssetTypeFilter from './AssetTypeFilter';
import DateRangeFilter from './DateRangeFilter';
import EventFilter from './EventFilter';

class FilterPanelMobile extends PureComponent {
  renderFilterHeader() {
    const { filters, toggleFilters } = this.props;

    return (
      <div className="catalog-filters-header">
        {I18nJS.t('screens.admin.activity_feed.mobile.filters')} {filters.activeFilterCount}
        <a href="#" onClick={toggleFilters} className="done-button">
          {I18nJS.t('screens.admin.activity_feed.mobile.done')}
        </a>
      </div>
    );
  }

  renderClearFilters() {
    const { clearAllFilters } = this.props;

    return (
      <a href="#" onClick={clearAllFilters} className="reset-filters">
        <SocrataIcon name="close-circle" />
        {I18nJS.t('screens.admin.activity_feed.mobile.reset_filters')}
      </a>
    );
  }

  render() {
    const {
      filtersOpen,
      toggleFilters
    } = this.props;

    const modalProps = {
      className: 'catalog-filters mobile',
      fullScreen: true,
      onDismiss: toggleFilters,
      overlay: true
    };

    return (filtersOpen ? (
      <Modal {...modalProps}>
        <ModalHeader onDismiss={toggleFilters} showCloseButton={false}>
          {this.renderFilterHeader()}
        </ModalHeader>
        <ModalContent>
          <div className="filter-content">
            <form>
              <DateRangeFilter />
              <AssetTypeFilter />
              <EventFilter />
            </form>
          </div>
        </ModalContent>
        <ModalFooter>
          {this.renderClearFilters()}
          <button className="btn btn-default btn-done" onClick={toggleFilters}>
            {I18nJS.t('screens.admin.activity_feed.mobile.done')}
          </button>
        </ModalFooter>
      </Modal>
    ) : null);
  }
}

FilterPanelMobile.propTypes = {
  filters: PropTypes.object.isRequired,
  clearAllFilters: PropTypes.func.isRequired,
  filtersOpen: PropTypes.bool.isRequired,
  toggleFilters: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  filters: state.filters,
  filtersOpen: state.common.filtersOpen
});

const mapDispatchToProps = (dispatch) => ({
  clearAllFilters: () => dispatch(actions.filters.clearAllFilters()),
  toggleFilters: () => dispatch(actions.common.toggleFilters())
});

export default connect(mapStateToProps, mapDispatchToProps)(FilterPanelMobile);
