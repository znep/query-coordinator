import React, { PropTypes } from 'react';
import SocrataIcon from '../SocrataIcon';
import { translate as t } from 'common/I18n';

export default function FilterFooter(props) {
  const { disableApplyFilter, isReadOnly, onClickApply, onClickRemove, onClickReset } = props;

  // Use an empty div instead of null so flexbox works properly
  const removeButton = isReadOnly ?
    <div /> :
    <button className="btn btn-sm btn-transparent remove-btn" onClick={onClickRemove}>
      <SocrataIcon name="close-2" />
      {t('filter_bar.remove')}
    </button>;

  return (
    <div className="filter-footer">
      {removeButton}
      <div className="apply-btn-container">
        <button className="btn btn-sm btn-transparent reset-btn" onClick={onClickReset}>
          {t('filter_bar.reset')}
        </button>
        <button
          className="btn btn-sm btn-alternate-2 apply-btn"
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
  isReadOnly: PropTypes.bool,
  onClickApply: PropTypes.func.isRequired,
  onClickRemove: PropTypes.func,
  onClickReset: PropTypes.func.isRequired
};
