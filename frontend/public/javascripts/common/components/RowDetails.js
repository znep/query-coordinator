import _ from 'lodash';
import utils from 'common/js_utils';
import PropTypes from 'prop-types';
import React from 'react';

// Renders a short <section> that lists the number of rows, number of columns,
// and row label of a dataset.
//
// NOTE: Row count may be fetched asynchronously, since we don't have this value
// immediately available (i.e. column stats service is not in use) and it may be
// expensive to get it on the fly for multi-million-row datasets (see EN-14299).
export default function RowDetails({ rowCount, columnCount, rowLabel }) {
  // Renders row count info. Omitted if row count is not a number.
  function renderRowCount() {
    if (!_.isNumber(rowCount)) {
      return null;
    }

    return (
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

  // Renders column count info. Omitted if column count is not a positive number.
  function renderColumnCount() {
    if (!_.isNumber(columnCount) || columnCount <= 0) {
      return null;
    }

    return (
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

  // Renders row label info. Omitted if the row label is empty or default.
  function renderRowLabel() {
    if (!rowLabel || rowLabel.toLowerCase() === I18n.common.default_row_label) {
      return null;
    }

    return (
      <div className="metadata-pair">
        <dt className="metadata-pair-key">
          {I18n.common.dataset_contents.row_display_unit}
        </dt>

        <dd itemProp="variableMeasured" className="metadata-pair-value">
          {rowLabel}
        </dd>
      </div>
    );
  }

  // Conditionally render row/column stats within the interior content box.
  // Shows a spinner while fetching the row count asychronously.
  function renderRowStats() {
    if (_.isUndefined(rowCount)) {
      return (
        <div className="metadata-section busy">
          <span className="spinner-default" />
        </div>
      );
    }

    return (
      <div className="metadata-section">
        <dl className="metadata-row">
          {renderRowCount()}
          {renderColumnCount()}
          {renderRowLabel()}
        </dl>
      </div>
    );
  }

  // Final component output.
  return (
    <section className="landing-page-section dataset-contents">
      <h2 className="landing-page-section-header">
        {I18n.common.dataset_contents.title}
      </h2>

      <div className="section-content">
        {renderRowStats()}
      </div>
    </section>
  );
}

RowDetails.propTypes = {
  rowCount: PropTypes.number,
  columnCount: PropTypes.number.isRequired,
  rowLabel: PropTypes.string.isRequired
};
