import React, { PropTypes } from 'react';
import ProgressBar from '../ProgressBar';
import { commaify } from '../../../common/formatNumber';

export default function UpsertJobNotification({ upsertJob, totalRows, rowsUpserted }) {
  const commaifiedRowsUpserted = commaify(rowsUpserted);
  const commaifiedTotalRows = commaify(totalRows);
  if (!upsertJob.status) {
    const percent = rowsUpserted / totalRows * 100;
    return (
      <div className="dsmui-notification in-progress">
        <span className="message">{I18n.progress_items.processing}</span>
        <span className="sub-message">
          ({commaifiedRowsUpserted} / {commaifiedTotalRows} {I18n.progress_items.rows})
        </span>
        <span className="percent-completed">{Math.round(percent)}%</span>
        <div className="upload-progress-bar">
          <ProgressBar percent={percent} />
        </div>
      </div>
    );
  } else if (upsertJob.status === 'successful') {
    return (
      <div className="dsmui-notification successful">
        <span className="message">{I18n.progress_items.processing}</span>
        <span className="sub-message">
          ({commaifiedTotalRows} / {commaifiedTotalRows} {I18n.progress_items.rows})
        </span>
        <span className="success-message">
          {I18n.progress_items.success}&nbsp;
          <span className="socrata-icon-check" />
        </span>
        <div className="upload-progress-bar">
          <ProgressBar percent={100} />
        </div>
      </div>
    );
  } else {
    return (
      <div className="dsmui-notification error">
        {I18n.progress_items.import_failed}
      </div>
    );
  }
}

UpsertJobNotification.propTypes = {
  upsertJob: PropTypes.object.isRequired,
  totalRows: PropTypes.number.isRequired,
  rowsUpserted: PropTypes.number.isRequired
};
