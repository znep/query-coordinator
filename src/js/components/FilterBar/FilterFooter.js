import React, { PropTypes } from 'react';
import { translate as t } from '../../common/I18n';

export default function FilterFooter(props) {
  const { disableApplyFilter, onClickApply, onClickCancel, onClickClear } = props;

  return (
    <div className="filter-footer">
      <button className="btn btn-sm btn-transparent clear-btn" onClick={onClickClear}>
        <span className="socrata-icon-close-2" role="presentation" />
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

FilterFooter.propTypes = {
  disableApplyFilter: PropTypes.bool,
  onClickApply: PropTypes.func.isRequired,
  onClickCancel: PropTypes.func.isRequired,
  onClickClear: PropTypes.func.isRequired
};
