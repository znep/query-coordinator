import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'socrata-components';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';

import { commaify } from '../../common/formatNumber';
import * as Links from '../links';
import * as Selectors from '../selectors';
import * as ShowActions from '../actions/showOutputSchema';
import * as ApplyActions from '../actions/applyUpdate';
import Table from './Table';
import ReadyToImport from './ReadyToImport';
import * as DisplayState from '../lib/displayState';

function query(db, uploadId, inputSchemaId, outputSchemaIdStr) {
  const outputSchemaId = _.toNumber(outputSchemaIdStr);
  const upload = db.uploads[_.toNumber(uploadId)];
  const inputSchema = db.input_schemas[_.toNumber(inputSchemaId)];
  const outputSchema = db.output_schemas[outputSchemaId];
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
  displayState,
  canApplyUpdate,
  goHome,
  updateColumnType,
  applyUpdate }) {

  const path = {
    uploadId: upload.id,
    inputSchemaId: inputSchema.id,
    outputSchemaId: outputSchema.id
  };

  const modalProps = {
    fullScreen: true,
    onDismiss: goHome
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
    onDismiss: goHome
  };

  const rowsTransformed = inputSchema.total_rows || Selectors.rowsTransformed(columns);

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
                inputSchema={inputSchema}
                outputSchema={outputSchema}
                displayState={displayState}
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

          <div className="output-schema-actions">
            <Link to={Links.home}>
              <button
                className="btn btn-default">
                {I18n.home_pane.save_for_later}
              </button>
            </Link>

            <button
              onClick={applyUpdate}
              disabled={!canApplyUpdate}
              className="btn btn-primary apply-update">
              {I18n.home_pane.process_data}
            </button>
          </div>
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
  goHome: PropTypes.func.isRequired,
  updateColumnType: PropTypes.func.isRequired,
  applyUpdate: PropTypes.func.isRequired,
  displayState: PropTypes.object.isRequired,
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
    displayState: DisplayState.fromUrl(_.pick(ownProps, ['params', 'route']))
  };
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    updateColumnType: (oldSchema, oldColumn, newType) => {
      dispatch(ShowActions.updateColumnType(oldSchema, oldColumn, newType));
    },
    goHome: () => {
      dispatch(push(Links.home(ownProps.location)));
    },
    applyUpdate: () => (
      dispatch(ApplyActions.applyUpdate(_.toNumber(ownProps.params.outputSchemaId)))
    )
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowOutputSchema);
