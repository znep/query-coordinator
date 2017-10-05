import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import connectLocalization from 'common/i18n/components/connectLocalization';

import * as filters from '../../actions/filters';

export class RecentlyViewedFilter extends React.Component {
  render() {
    const { onlyRecentlyViewed, toggleRecentlyViewed, I18n } = this.props;

    const inputId = 'filter-recently-viewed';

    return (
      <div className="filter-section recently-viewed">
        <div className="checkbox checkbox-filter">
          <input id={inputId} type="checkbox" onChange={toggleRecentlyViewed} checked={onlyRecentlyViewed} />
          <label htmlFor={inputId}>
            <span className="fake-checkbox"><span className="socrata-icon-checkmark3"></span></span>
            {I18n.t('internal_asset_manager.filters.recently_viewed.label')}
          </label>
        </div>
      </div>
    );
  }
}

RecentlyViewedFilter.propTypes = {
  onlyRecentlyViewed: PropTypes.bool,
  toggleRecentlyViewed: PropTypes.func.isRequired,
  I18n: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  onlyRecentlyViewed: state.filters.onlyRecentlyViewed
});

const mapDispatchToProps = (dispatch) => ({
  toggleRecentlyViewed: (value) => dispatch(filters.toggleRecentlyViewed(value))
});

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(RecentlyViewedFilter));
