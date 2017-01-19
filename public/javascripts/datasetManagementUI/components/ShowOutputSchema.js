import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'socrata-components';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';

import * as Links from '../links';
import * as Selectors from '../selectors';
import { STATUS_UPDATING, STATUS_UPDATE_FAILED } from '../lib/database/statuses';
import * as ShowActions from '../actions/showOutputSchema';
import * as ApplyActions from '../actions/applyUpdate';
import Table from './Table';

function query(db, uploadId, schemaId, outputSchemaIdStr) {
  const outputSchemaId = _.toNumber(outputSchemaIdStr);
  const upload = _.find(db.uploads, { id: _.toNumber(uploadId) });
  const schema = _.find(db.schemas, { id: _.toNumber(schemaId) });
  const outputSchema = _.find(db.schemas, { id: outputSchemaId });
  const columns = Selectors.columnsForOutputSchema(db, outputSchemaId);

  return {
    db,
    upload,
    schema,
    outputSchema,
    columns
  };
}

export function ShowOutputSchema({ db, upload, columns, outputSchema,
                                   goToUpload, updateColumnType, applyUpdate }) {
  let uploadProgress;
  switch (upload.__status__.type) {
    case STATUS_UPDATING:
      uploadProgress = I18n.show_output_schema.upload_in_progress;
      break;

    case STATUS_UPDATE_FAILED:
      uploadProgress = I18n.show_output_schema.upload_failed;
      break;

    default:
      uploadProgress = I18n.show_output_schema.upload_done;
  }

  const modalProps = {
    fullScreen: true,
    onDismiss: goToUpload
  };
  const headerProps = {
    title: (
      <span>
        <Link to={Links.uploads}>{I18n.home_pane.data}</Link> &gt;&nbsp;
        <Link to={Links.showUpload(upload.id)}>{upload.filename}</Link> ({uploadProgress}) &gt;&nbsp;
        {I18n.home_pane.preview}
      </span>
    ),
    onDismiss: goToUpload
  };

  return (
    <div id="show-output-schema">
      <Modal {...modalProps}>
        <ModalHeader {...headerProps} />

        <ModalContent>
          <Table
            db={db}
            columns={columns}
            outputSchema={outputSchema}
            updateColumnType={updateColumnType} />
        </ModalContent>

        <ModalFooter>
          <button
            onClick={applyUpdate}
            className="btn btn-primary">
            {I18n.home_pane.apply_update}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

ShowOutputSchema.propTypes = {
  db: PropTypes.object.isRequired,
  upload: PropTypes.object.isRequired,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  outputSchema: PropTypes.object.isRequired,
  goToUpload: PropTypes.func.isRequired,
  updateColumnType: PropTypes.func.isRequired,
  applyUpdate: PropTypes.func.isRequired
};

function mapStateToProps(state, ownProps) {
  const params = ownProps.params;
  return query(
    state.db,
    _.toNumber(params.uploadId),
    _.toNumber(params.schemaId),
    _.toNumber(params.outputSchemaId)
  );
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    updateColumnType: (oldSchema, oldColumn, newType) => {
      dispatch(ShowActions.updateColumnType(oldSchema, oldColumn, newType));
    },
    goToUpload: () => (
      dispatch(push(Links.showUpload(_.toNumber(ownProps.params.uploadId))(ownProps.location)))
    ),
    applyUpdate: () => (
      dispatch(ApplyActions.applyUpdate(_.toNumber(ownProps.params.outputSchemaId)))
    )
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowOutputSchema);
