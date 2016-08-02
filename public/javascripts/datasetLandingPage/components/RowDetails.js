import utils from 'socrata-utils';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

export var RowDetails = function(props) {
  var { view } = props;

  var rowCountInfo;
  var columnCountInfo;
  var rowLabelInfo;

  if (_.isNumber(view.rowCount)) {
    rowCountInfo = (
      <div className="metadata-pair">
        <dt className="metadata-pair-key">
          {I18n.dataset_contents.rows}
        </dt>

        <dd className="metadata-pair-value">
          {utils.formatNumber(view.rowCount)}
        </dd>
      </div>
    );
  }

  if (_.isArray(view.columns)) {
    columnCountInfo = (
      <div className="metadata-pair">
        <dt className="metadata-pair-key">
          {I18n.dataset_contents.columns}
        </dt>

        <dd className="metadata-pair-value">
          {utils.formatNumber(view.columns.length)}
        </dd>
      </div>
    );
  }

  if (view.rowLabel && view.rowLabel.toLowerCase() !== I18n.default_row_label) {
    rowLabelInfo = (
      <div className="metadata-pair">
        <dt className="metadata-pair-key">
          {I18n.dataset_contents.row_display_unit}
        </dt>

        <dd className="metadata-pair-value">
          {view.rowLabel}
        </dd>
      </div>
    );
  }

  return (
    <section className="landing-page-section dataset-contents">
      <h2 className="landing-page-section-header">
        {I18n.dataset_contents.title}
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
};

RowDetails.propTypes = {
  view: PropTypes.object.isRequired
};

function mapStateToProps(state) {
  return _.pick(state, 'view');
}

export default connect(mapStateToProps)(RowDetails);
