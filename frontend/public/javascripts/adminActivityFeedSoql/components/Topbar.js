import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import I18nJS from 'common/i18n';
import SearchBox from './SearchBox';
import SocrataIcon from 'common/components/SocrataIcon';
import ClearFilters from './ClearFilters';
import * as actions from '../actions';

class Topbar extends PureComponent {

  render() {
    const { isMobile, filters, toggleFilters, changeAffectedItemSearch } = this.props;

    const topbarClassnames = classNames('topbar clearfix', {
      'mobile': isMobile
    });

    const mobileFilterToggle = isMobile ? (
      <a href="#" className="mobile-filter-toggle" onClick={toggleFilters}>
        {I18nJS.t('screens.admin.activity_feed.mobile.filters')}
        <span className="active-filter-count">({filters.activeFilterCount})</span>
        <SocrataIcon name="arrow-right" />
      </a>
    ) : null;

    const clearFiltersProps = {
      buttonStyle: true,
      showTitle: false
    };

    const clearFiltersButton = isMobile ?
      null : <ClearFilters {...clearFiltersProps} />;

    const searchBoxProps = {
      searchValue: filters.affectedItemSearch,
      searchCallback: changeAffectedItemSearch,
      placeholder: I18nJS.t('screens.admin.activity_feed.columns.affected_item'),
      className: 'affected-item-searchbox'
    };

    return (
      <div className={topbarClassnames}>
        {mobileFilterToggle}
        <SearchBox {...searchBoxProps} />
        {clearFiltersButton}
      </div>
    );
  }
}

Topbar.defaultProps = {
  currentQuery: '',
  filters: {}
};

Topbar.propTypes = {
  currentQuery: PropTypes.string.isRequired,
  filters: PropTypes.object.isRequired,
  toggleFilters: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  isMobile: state.windowDimensions.isMobile,
  filters: state.filters
});

const mapDispatchToProps = (dispatch) => ({
  toggleFilters: () => dispatch(actions.common.toggleFilters()),
  changeAffectedItemSearch: (value) => dispatch(actions.filters.changeAffectedItemSearch(value))
});

export default connect(mapStateToProps, mapDispatchToProps)(Topbar);
