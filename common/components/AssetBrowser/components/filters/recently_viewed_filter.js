import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import I18n from 'common/i18n';
import SocrataIcon from 'common/components/SocrataIcon';

import * as filters from 'common/components/AssetBrowser/actions/filters';

export class RecentlyViewedFilter extends Component {
  render() {
    const { onlyRecentlyViewed, toggleRecentlyViewed } = this.props;

    const inputId = 'filter-recently-viewed';

    return (
      <div className="filter-section recently-viewed">
        <div className="checkbox checkbox-filter">
          <input id={inputId} type="checkbox" onChange={toggleRecentlyViewed} checked={onlyRecentlyViewed} />
          <label htmlFor={inputId}>
            <span className="fake-checkbox">
              <SocrataIcon name="checkmark3" />
            </span>
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
