import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router';
import * as Links from 'datasetManagementUI/links/links';
import {
  SAVED,
  UNSAVED,
  ERRORED,
  INITIALIZED
} from 'datasetManagementUI/components/ManageMetadata/ManageMetadata';
import StatusIndicator from 'datasetManagementUI/components/StatusIndicator/StatusIndicator';

const datasetMetadataEnabled = !window.serverConfig.featureFlags.usaid_features_enabled;

const FormStatusText = ({ formStatus }) => {
  let statusText;

  switch (formStatus) {
    case INITIALIZED:
      statusText = I18n.metadata_manage.status_no_change;
      break;
    case SAVED:
      statusText = I18n.metadata_manage.status_saved;
      break;
    case UNSAVED:
      statusText = I18n.metadata_manage.status_unsaved_changes;
      break;
    case ERRORED:
      statusText = I18n.metadata_manage.status_error;
      break;
    default:
      statusText = '&nbsp;';
  }

  return (
    <span className={formStatus === ERRORED ? 'dsmp-status-text-error' : 'dsmp-status-text'}>
      {statusText}
    </span>
  );
};

FormStatusText.propTypes = {
  formStatus: PropTypes.string
};

const ManageMetadataSidebar = ({
  params,
  outputSchemaId,
  columnsExist,
  hideFlash,
  datasetFormStatus,
  columnFormStatus
}) => {
  return (
    <div className="dsmp-sidebar">
      {datasetMetadataEnabled ? (
        <Link
          onClick={!!params.outputSchemaId ? hideFlash : () => {}}
          to={Links.datasetMetadataForm(params)}
          className="dsmp-tab"
          activeClassName="selected">
          {I18n.metadata_manage.dataset_metadata_label}
          <br />
          <FormStatusText formStatus={datasetFormStatus} />
          <StatusIndicator formStatus={datasetFormStatus} />
        </Link>
      ) : (
        <span className="dsmp-tab disabled">{I18n.metadata_manage.dataset_metadata_label}</span>
      )}
      {columnsExist ? (
        <Link
          onClick={!!params.outputSchemaId ? () => {} : hideFlash}
          to={Links.columnMetadataForm(params, outputSchemaId)}
          className="dsmp-tab"
          activeClassName="selected">
          {I18n.metadata_manage.column_metadata_label}
          <br />
          <FormStatusText formStatus={columnFormStatus} />
          <StatusIndicator formStatus={columnFormStatus} />
        </Link>
      ) : (
        <span className="dsmp-tab disabled" title={I18n.home_pane.sidebar.no_columns_msg}>
          {I18n.metadata_manage.column_metadata_label}
          <br />
          <span>&nbsp;</span>
        </span>
      )}
    </div>
  );
};

ManageMetadataSidebar.propTypes = {
  params: PropTypes.object.isRequired,
  hideFlash: PropTypes.func.isRequired,
  outputSchemaId: PropTypes.number,
  columnsExist: PropTypes.bool.isRequired,
  datasetFormStatus: PropTypes.string.isRequired,
  columnFormStatus: PropTypes.string.isRequired
};

export default ManageMetadataSidebar;
