import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'socrata-components';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';

import { commaify } from '../../common/formatNumber';
import * as Links from '../links';
import * as Selectors from '../selectors';
import { STATUS_UPDATING, STATUS_UPDATE_FAILED } from '../lib/database/statuses';
import * as ShowActions from '../actions/showOutputSchema';
import * as ApplyActions from '../actions/applyUpdate';
import Table from './Table';
import ReadyToImport from './ReadyToImport';

function query(db, uploadId, inputSchemaId, outputSchemaIdStr) {
  const outputSchemaId = _.toNumber(outputSchemaIdStr);
  const upload = _.find(db.uploads, { id: _.toNumber(uploadId) });
  const inputSchema = _.find(db.input_schemas, { id: _.toNumber(inputSchemaId) });
  const outputSchema = _.find(db.output_schemas, { id: outputSchemaId });
  const columns = Selectors.columnsForOutputSchema(db, outputSchemaId);

  const canApplyUpdate = columns.every((column) => {
    return column.transform.contiguous_rows_processed &&
      column.transform.contiguous_rows_processed === inputSchema.total_rows;
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

export function ShowOutputSchema({
  db,
  upload,
  inputSchema,
  outputSchema,
  columns,
  errorsTransformId,
  canApplyUpdate,
  goToUpload,
  updateColumnType,
  applyUpdate }) {

  const SubI18n = I18n.show_output_schema;
  const path = {
    uploadId: upload.id,
    inputSchemaId: inputSchema.id,
    outputSchemaId: outputSchema.id
  };

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
      <ol>
        <li>
          <Link to={Links.uploads}>
            {I18n.home_pane.data}
          </Link>
          <span className="socrata-icon-arrow-right"></span>
        </li>
        <li className="active">
          {I18n.home_pane.preview}
        </li>
      </ol>
    ),
    onDismiss: goToUpload
  };

  const rowsTransformed = inputSchema.total_rows || _.min(
    columns.map((col) => col.transform.contiguous_rows_processed)
  ) || 0;


  return (
    <div id="show-output-schema">
      <Modal {...modalProps}>
        <ModalHeader {...headerProps} />

        <ModalContent>
          <div>
            <div className="data-preview">
              <div>
                <h3>Data Preview</h3>
              </div>
              <div className="dataset-attributes">
                <div className="dataset-attribute">
                  <p className="attribute-label small">Rows</p>
                  <p className="attribute total-row-count">{commaify(rowsTransformed)}</p>
                </div>
                <div className="dataset-attribute">
                  <p className="attribute-label small">Columns</p>
                  <p className="attribute">{columns.length}</p>
                </div>
              </div>
            </div>

            <div className="table-wrap">
              <Table
                db={db}
                path={path}
                columns={columns}
                totalRows={inputSchema.total_rows}
                outputSchema={outputSchema}
                errorsTransformId={errorsTransformId}
                updateColumnType={updateColumnType} />
            </div>
          </div>


        </ModalContent>

        <ModalFooter>
          {canApplyUpdate ?
            <ReadyToImport
              db={db}
              outputSchema={outputSchema} /> :
            <div />}

          <button
            onClick={applyUpdate}
            disabled={!canApplyUpdate}
            className="btn btn-primary apply-update">
            {I18n.home_pane.process_data}
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
  errorsTransformId: PropTypes.number,
  canApplyUpdate: PropTypes.bool.isRequired
};

function mapStateToProps(state, ownProps) {
  const params = ownProps.params;
  const queryResults = query(
    state.db,
    _.toNumber(params.uploadId),
    _.toNumber(params.inputSchemaId),
    _.toNumber(params.outputSchemaId)
  );
  return {
    ...queryResults,
    errorsTransformId: params.errorsTransformId ? _.toNumber(params.errorsTransformId) : null
  };
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
