import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import I18n from 'common/i18n';

import * as filters from '../../actions/filters';

export class RecentlyViewedFilter extends Component {
  render() {
    const { onlyRecentlyViewed, toggleRecentlyViewed } = this.props;

    const inputId = 'filter-recently-viewed';

    return (
      <div className="filter-section recently-viewed">
        <div className="checkbox checkbox-filter">
          <input id={inputId} type="checkbox" onChange={toggleRecentlyViewed} checked={onlyRecentlyViewed} />
          <label htmlFor={inputId}>
            <span className="fake-checkbox"><span className="socrata-icon-checkmark3"></span></span>
            {I18n.t('shared.asset_browser.filters.recently_viewed.label')}
          </label>
        </div>
      </div>
    );
  }
}

RecentlyViewedFilter.propTypes = {
  onlyRecentlyViewed: PropTypes.bool,
  toggleRecentlyViewed: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  onlyRecentlyViewed: state.filters.onlyRecentlyViewed
});

const mapDispatchToProps = (dispatch) => ({
  toggleRecentlyViewed: (value) => dispatch(filters.toggleRecentlyViewed(value))
});

export default connect(mapStateToProps, mapDispatchToProps)(RecentlyViewedFilter);
