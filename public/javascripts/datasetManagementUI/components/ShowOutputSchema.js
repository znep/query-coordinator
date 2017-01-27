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

function query(db, uploadId, inputSchemaId, outputSchemaIdStr) {
  const outputSchemaId = _.toNumber(outputSchemaIdStr);
  const upload = _.find(db.uploads, { id: _.toNumber(uploadId) });
  const inputSchema = _.find(db.input_schemas, { id: _.toNumber(inputSchemaId) });
  const outputSchema = _.find(db.output_schemas, { id: outputSchemaId });
  const columns = Selectors.columnsForOutputSchema(db, outputSchemaId);

  const canApplyUpdate = columns.every((column) => {
    return column.contiguous_rows_processed === inputSchema.total_rows;
  });

  return {
    db,
    upload,
    inputSchema,
    outputSchema,
    columns,
    canApplyUpdate
  };
}

export function ShowOutputSchema({ db, upload, inputSchema, outputSchema,
                                   columns, canApplyUpdate,
                                   goToUpload, updateColumnType, applyUpdate }) {
  const SubI18n = I18n.show_output_schema;
  let uploadProgress;
  switch (upload.__status__.type) {
    case STATUS_UPDATING:
      uploadProgress = SubI18n.upload_in_progress;
      break;

    case STATUS_UPDATE_FAILED:
      uploadProgress = SubI18n.upload_failed;
      break;

    default:
      uploadProgress = SubI18n.upload_done;
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

  let totalRowCountMsg;
  if (!_.isNumber(inputSchema.total_rows)) {
    const rowsTransformed = _.get(
      _.minBy(columns, 'contiguous_rows_processed'),
      'contiguous_rows_processed', 0
    );
    totalRowCountMsg = `${rowsTransformed} ${SubI18n.rows_so_far}`;
  } else {
    totalRowCountMsg = `${inputSchema.total_rows} ${SubI18n.rows_total}`;
  }

  return (
    <div id="show-output-schema">
      <Modal {...modalProps}>
        <ModalHeader {...headerProps} />

        <ModalContent>
          <div>
            <span className="total-row-count">{totalRowCountMsg}</span>
            <Table
              db={db}
              columns={columns}
              totalRows={inputSchema.total_rows}
              outputSchema={outputSchema}
              updateColumnType={updateColumnType} />
          </div>
        </ModalContent>

        <ModalFooter>
          <button
            onClick={applyUpdate}
            disabled={!canApplyUpdate}
            className="btn btn-primary apply-update">
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
  inputSchema: PropTypes.object.isRequired,
  outputSchema: PropTypes.object.isRequired,
  goToUpload: PropTypes.func.isRequired,
  updateColumnType: PropTypes.func.isRequired,
  applyUpdate: PropTypes.func.isRequired,
  canApplyUpdate: PropTypes.bool.isRequired
};

function mapStateToProps(state, ownProps) {
  const params = ownProps.params;
  return query(
    state.db,
    _.toNumber(params.uploadId),
    _.toNumber(params.inputSchemaId),
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
