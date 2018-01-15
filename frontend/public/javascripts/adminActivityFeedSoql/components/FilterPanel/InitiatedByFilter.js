import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import I18nJS from 'common/i18n';
import classNames from 'classnames';

import SearchBox from '../SearchBox';
import * as actions from '../../actions';

class InitiatedByFilter extends PureComponent {
  render() {
    const { changeInitiatedBySearch, value, mobile } = this.props;

    const searchBoxProps = {
      id: 'initiated-by-search-box',
      searchValue: value,
      searchCallback: changeInitiatedBySearch,
      placeholder: I18nJS.t('screens.admin.activity_feed.any_user'),
      className: classNames('initiated-by-searchbox', { mobile })
    };

    return (
      <div className="filter-section initiated-by-filter">
        <label className="filter-label">
          {I18nJS.t('screens.admin.activity_feed.columns.acting_user_name')}
        </label>
        <SearchBox {...searchBoxProps} />
      </div>
    );
  }
}

InitiatedByFilter.propTypes = {
  value: PropTypes.string,
  mobile: PropTypes.bool,
  changeInitiatedBySearch: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  value: state.filters.initiatedBySearch
});

const mapDispatchToProps = (dispatch) => ({
  changeInitiatedBySearch: (value) => dispatch(actions.filters.changeInitiatedBySearch(value))
});

export default connect(mapStateToProps, mapDispatchToProps)(InitiatedByFilter);
