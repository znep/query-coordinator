import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router';
import NotifyButton from 'containers/NotifyButtonContainer';
import * as Links from 'links/links';
import DatasetPreview from 'containers/DatasetPreviewContainer';
import styles from './TablePreview.scss';

// COMPONENT VIEWS
export const NoDataYetView = ({ params }) => (
  <div className="no-data-view">
    <div className={styles.headerWrapper}>
      <h2 className={styles.header}>{I18n.home_pane.table_preview}</h2>
      <div className="button-group">
        <Link to={Links.sources(params)} className="btn btn-sm btn-default btn-alternate-2">
          <span className="socrata-icon-plus2" /> {I18n.home_pane.add_data}
        </Link>
      </div>
    </div>
    <div className={styles.resultCard}>
      <div className={styles.tableInfo}>
        <h3 className={styles.previewAreaHeader}>{I18n.home_pane.no_data_yet}</h3>
        <p>{I18n.home_pane.adding_data_is_easy_and_fun}</p>
      </div>
    </div>
  </div>
);

NoDataYetView.propTypes = {
  params: PropTypes.object.isRequired
};

export const HrefView = ({ params }) => (
  <div className="href-view">
    <div className={styles.headerWrapper}>
      <h2 className={styles.header}>{I18n.home_pane.table_preview}</h2>
      <div className="button-group">
        <Link to={Links.sources(params)} className="btn btn-sm btn-default btn-alternate-2">
          <span className="socrata-icon-plus2" /> {I18n.home_pane.add_data}
        </Link>
        <Link to={Links.hrefSource(params)} className="btn btn-sm btn-default btn-alternate-2">
          <span className="socrata-icon-eye" /> {I18n.home_pane.href_view_btn}
        </Link>
      </div>
    </div>
    <div className={styles.resultCard}>
      <div className={styles.tableInfo}>
        <h3 className={styles.previewAreaHeader}>{I18n.home_pane.href_header}</h3>
        <p>{I18n.home_pane.href_message}</p>
      </div>
    </div>
  </div>
);

HrefView.propTypes = {
  params: PropTypes.object.isRequired
};

export const PreviewDataView = ({ entities, outputSchema, blob, params }) => {
  let previewDataPath;
  if (outputSchema) {
    const inputSchema = _.find(entities.input_schemas, { id: outputSchema.input_schema_id });
    if (!inputSchema) return;
    previewDataPath = Links.showOutputSchema(params, inputSchema.source_id, inputSchema.id, outputSchema.id);
  } else if (blob) {
    previewDataPath = Links.showBlobPreview(params, blob.id);
  } else {
    return;
  }

  return (
    <div className="preview-data-view">
      <div className={styles.headerWrapper}>
        <h2 className={styles.header}>{I18n.home_pane.table_preview}</h2>
        <div className="button-group">
          <Link to={Links.sources(params)} className="btn btn-sm btn-default btn-alternate-2">
            <span className="socrata-icon-plus2" /> {I18n.home_pane.add_data}
          </Link>
          <Link to={previewDataPath} className="btn btn-sm btn-default btn-alternate-2">
            {I18n.home_pane.review_data}
          </Link>
        </div>
      </div>
      <div className={styles.resultCard}>
        <div className={styles.tableInfo}>
          <h3 className={styles.previewAreaHeader}>{I18n.home_pane.data_uploaded}</h3>
          <p>{I18n.home_pane.data_uploaded_blurb}</p>
        </div>
      </div>
    </div>
  );
};

PreviewDataView.propTypes = {
  entities: PropTypes.object.isRequired,
  outputSchema: PropTypes.object,
  blob: PropTypes.object,
  params: PropTypes.object.isRequired
};

export const UpsertInProgressView = () => (
  <div className="upsert-in-progress-view">
    <div className={styles.headerWrapper}>
      <h2 className={styles.header}>{I18n.home_pane.table_preview}</h2>
      <div className="button-group">
        <NotifyButton />
      </div>
    </div>
    <div className={styles.resultCard}>
      <div className={styles.tableInfo}>
        <h3 className={styles.previewAreaHeader}>{I18n.home_pane.being_processed}</h3>
        <p>{I18n.home_pane.being_processed_detail}</p>
      </div>
    </div>
  </div>
);

export const UpsertCompleteView = ({ view, outputSchema }) => (
  <div className="upsert-complete-view">
    <div className={styles.headerWrapper}>
      <h2 className={styles.header}>{I18n.home_pane.table_preview}</h2>
    </div>
    <div className={styles.resultCard}>
      <div key="upsertCompleteView">
        <DatasetPreview view={view} outputSchema={outputSchema} />
      </div>
    </div>
  </div>
);

UpsertCompleteView.propTypes = {
  view: PropTypes.object.isRequired,
  outputSchema: PropTypes.object.isRequired
};
