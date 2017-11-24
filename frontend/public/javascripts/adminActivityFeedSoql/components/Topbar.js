import _ from 'lodash';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import I18nJS from 'common/i18n';
import Autocomplete from 'common/autocomplete/components/Autocomplete';
import SocrataIcon from 'common/components/SocrataIcon';
import ClearFilters from './ClearFilters';
import * as actions from '../actions';

class Topbar extends PureComponent {

  fetchAutocompleteSuggestions(searchTerm, callback) { //eslint-disable-line

  }

  renderAutoComplete() {
    const { currentQuery, isMobile } = this.props;

    const autocompleteOptions = {
      animate: true,
      anonymous: false,
      collapsible: false,
      currentQuery,
      getSearchResults: this.fetchAutocompleteSuggestions,
      millisecondsBeforeSearch: 60,
      mobile: isMobile,
      onChooseResult: _.noop,
      onClearSearch: _.noop,
      adminHeaderClasses: []
    };

    return <Autocomplete {...autocompleteOptions} className="autocomplete" />;
  }

  render() {
    const { isMobile, filters, toggleFilters } = this.props;

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

    return (
      <div className={topbarClassnames}>
        {mobileFilterToggle}
        {this.renderAutoComplete()}
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
  toggleFilters: () => dispatch(actions.common.toggleFilters())
});

export default connect(mapStateToProps, mapDispatchToProps)(Topbar);
