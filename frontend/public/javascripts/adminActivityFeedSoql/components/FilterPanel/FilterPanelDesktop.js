import _ from 'lodash';
import React, { PureComponent } from 'react';
import classNames from 'classnames';
import { handleEnter } from 'common/dom_helpers/keyPressHelpers';
import I18nJS from 'common/i18n';

import AssetTypeFilter from './AssetTypeFilter';
import DateRangeFilter from './DateRangeFilter';
import EventFilter from './EventFilter';
import InitiatedByFilter from './InitiatedByFilter';
import ClearFilters from '../ClearFilters';

class FilterPanelDesktop extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      filterContentOpen: true
    };

    _.bindAll(this, 'handleFilterContentToggleClick');
  }

  handleFilterContentToggleClick() {
    this.setState({ filterContentOpen: !this.state.filterContentOpen });
  }

  renderHeader() {
    const { filterContentOpen } = this.state;

    const closeButtonProps = {
      className: 'close-filters filter-content-toggle',
      onClick: this.handleFilterContentToggleClick,
      onKeyDown: handleEnter(this.handleFilterContentToggleClick, true)
    };

    const spanProps = {
      'aria-label': I18nJS.t('screens.admin.activity_feed.filters.desktop.contract'),
      className: 'socrata-icon-arrow-right',
      title: I18nJS.t('screens.admin.activity_feed.filters.desktop.contract')
    };

    const closeFiltersButton = filterContentOpen ? (
      <button {...closeButtonProps}>
        {I18nJS.t('screens.admin.activity_feed.filters.desktop.hide')}
        <span {...spanProps} />
      </button>
    ) : null;

    return (
      <div className="catalog-filters-header">
        <ClearFilters />
        {closeFiltersButton}
      </div>
    );
  }

  renderOpenButton() {
    const { filterContentOpen } = this.state;

    const buttonProps = {
      className: 'open-filters filter-content-toggle',
      onClick: this.handleFilterContentToggleClick,
      onKeyDown: handleEnter(this.handleFilterContentToggleClick, true)
    };

    const spanProps = {
      'aria-label': I18nJS.t('screens.admin.activity_feed.filters.desktop.expand'),
      'className': 'socrata-icon-arrow-left',
      'title': I18nJS.t('screens.admin.activity_feed.filters.desktop.expand')
    };

    return !filterContentOpen ? (
      <button {...buttonProps}>
        <span {...spanProps} />
      </button>
    ) : null;
  }

  render() {
    const { filterContentOpen } = this.state;

    const filterContentClass = classNames(
      'filter-content',
      { hidden: !filterContentOpen }
    );

    return (
      <div className="catalog-filters">
        {this.renderOpenButton()}
        <div className={filterContentClass}>
          {this.renderHeader()}
          <DateRangeFilter />
          <AssetTypeFilter />
          <EventFilter />
          <InitiatedByFilter />
        </div>
      </div>
    );
  }
}

export default FilterPanelDesktop;
