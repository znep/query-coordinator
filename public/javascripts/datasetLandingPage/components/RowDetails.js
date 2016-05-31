import utils from 'socrata-utils';
import React, { PropTypes } from 'react';

var RowDetails = function(props) {
  var { view, showAsLayer } = props;

  var rowCountInfo;
  var columnCountInfo;
  var rowLabelInfo;

  if (_.isNumber(view.rowCount)) {
    rowCountInfo = (
      <div className="metadata-pair">
        <span className="metadata-pair-key">
          {I18n.dataset_contents.rows}
        </span>

        <h3 className="metadata-pair-value">
          {utils.formatNumber(view.rowCount)}
        </h3>
      </div>
    );
  }

  if (_.isArray(view.columns)) {
    columnCountInfo = (
      <div className="metadata-pair">
        <span className="metadata-pair-key">
          {I18n.dataset_contents.columns}
        </span>

        <h3 className="metadata-pair-value">
          {utils.formatNumber(view.columns.length)}
        </h3>
      </div>
    );
  }

  if (view.rowLabel && view.rowLabel.toLowerCase() !== I18n.default_row_label) {
    rowLabelInfo = (
      <div className="metadata-pair">
        <span className="metadata-pair-key">
          {I18n.dataset_contents.row_display_unit}
        </span>

        <h3 className="metadata-pair-value">
          {view.rowLabel}
        </h3>
      </div>
    );
  }

  return (
    <section className="landing-page-section dataset-contents">
      <h2 className="landing-page-section-header">
        {showAsLayer ? view.name : I18n.dataset_contents.title}
      </h2>

      <div className="section-content">
        <div className="metadata-section">
          <div className="metadata-row">
            {rowCountInfo}
            {columnCountInfo}
            {rowLabelInfo}
          </div>
        </div>
      </div>
    </section>
  );
};

RowDetails.propTypes = {
  view: PropTypes.object.isRequired,
  showAsLayer: PropTypes.bool
};

export default RowDetails;
