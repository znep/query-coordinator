import _ from 'lodash';
import React, { PropTypes } from 'react';
import { translate as t } from '../../common/I18n';

export const FilterFooter = React.createClass({
  propTypes: {
    disableApplyFilter: PropTypes.bool,
    onClickApply: PropTypes.func,
    onClickCancel: PropTypes.func,
    onClickClear: PropTypes.func
  },

  getDefaultProps() {
    return {
      onClickApply: _.noop,
      onClickCancel: _.noop,
      onClickClear: _.noop
    };
  },

  render() {
    const { disableApplyFilter, onClickApply, onClickCancel, onClickClear } = this.props;

    return (
      <div className="filter-footer">
        <button className="btn btn-sm btn-transparent clear-btn" onClick={onClickClear}>
          <span className="icon-close-2" role="presentation" />
          {t('filter_bar.clear')}
        </button>
        <div className="apply-btn-container">
          <button className="btn btn-sm btn-transparent cancel-btn" onClick={onClickCancel}>
            {t('filter_bar.cancel')}
          </button>
          <button
            className="btn btn-sm btn-default apply-btn"
            onClick={onClickApply}
            disabled={disableApplyFilter}>
            {t('filter_bar.apply')}
          </button>
        </div>
      </div>
    );
  }
});

export default FilterFooter;
