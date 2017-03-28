import _ from 'lodash';
import utils from 'common/js_utils';
import React, { PropTypes } from 'react';

export default function RowDetails({ rowCount, columnCount, rowLabel }) {
  let rowCountInfo;
  let columnCountInfo;
  let rowLabelInfo;

  if (_.isNumber(rowCount)) {
    rowCountInfo = (
      <div className="metadata-pair">
        <dt className="metadata-pair-key">
          {I18n.common.dataset_contents.rows}
        </dt>

        <dd className="metadata-pair-value">
          {utils.formatNumber(rowCount)}
        </dd>
      </div>
    );
  }

  if (columnCount > 0) {
    columnCountInfo = (
      <div className="metadata-pair">
        <dt className="metadata-pair-key">
          {I18n.common.dataset_contents.columns}
        </dt>

        <dd className="metadata-pair-value">
          {utils.formatNumber(columnCount)}
        </dd>
      </div>
    );
  }

  if (rowLabel && rowLabel.toLowerCase() !== I18n.common.default_row_label) {
    rowLabelInfo = (
      <div className="metadata-pair">
        <dt className="metadata-pair-key">
          {I18n.common.dataset_contents.row_display_unit}
        </dt>

        <dd className="metadata-pair-value">
          {rowLabel}
        </dd>
      </div>
    );
  }

  return (
    <section className="landing-page-section dataset-contents">
      <h2 className="landing-page-section-header">
        {I18n.common.dataset_contents.title}
      </h2>

      <div className="section-content">
        <div className="metadata-section">
          <dl className="metadata-row">
            {rowCountInfo}
            {columnCountInfo}
            {rowLabelInfo}
          </dl>
        </div>
      </div>
    </section>
  );
}

RowDetails.propTypes = {
  rowCount: PropTypes.number.isRequired,
  columnCount: PropTypes.number.isRequired,
  rowLabel: PropTypes.string.isRequired
};
