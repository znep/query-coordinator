import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import { Modal, ModalHeader, ModalContent } from 'socrata-components';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';

import ColumnHeader from './ColumnHeader';
import * as Links from '../links';
import { STATUS_UPDATING } from '../lib/database/statuses';
import * as Actions from '../actions/showOutputSchema';

function query(db, uploadId, schemaId, outputSchemaId) {
  const upload = _.find(db.uploads, { id: uploadId });
  const schema = _.find(db.schemas, { id: schemaId });
  const outputSchema = _.find(db.schemas, { id: outputSchemaId });
  const schemaColumns = _.filter(db.schema_columns, { schema_id: outputSchema.id });
  const unsortedColumns = _.filter(
    db.columns,
    (column) => schemaColumns.some(
      (schemaColumn) =>
        column.id === schemaColumn.column_id && schemaColumn.schema_id === outputSchemaId
    )
  );
  const columns = _.sortBy(unsortedColumns, 'schema_column_index');

  return {
    db,
    upload,
    schema,
    outputSchema,
    columns
  };
}

export function ShowOutputSchema({ db, upload, columns, outputSchema, goToUpload, updateColumnType }) {
  // TODO: I18n
  const uploadProgress = upload.__status__.type === STATUS_UPDATING ?
    `${Math.round(upload.__status__.percentCompleted)}% Uploaded` :
    'Upload Done';

  const modalProps = {
    fullScreen: true,
    onDismiss: goToUpload
  };
  const headerProps = {
    title: (
      <span>
        <Link to={Links.uploads}>{I18n.home_pane.data}</Link> &gt;&nbsp;
        <Link to={Links.showUpload(upload.id)}>{upload.filename}</Link> ({uploadProgress}) &gt;
        Preview
      </span>
    ),
    onDismiss: goToUpload
  };

  return (
    <div id="show-output-schema">
      <Modal {...modalProps}>
        <ModalHeader {...headerProps} />

        <ModalContent>
          <table className="table table-condensed">
            <thead>
              <tr>
                {
                  columns.map(column =>
                    <ColumnHeader
                      key={column.id}
                      outputSchema={outputSchema}
                      column={column}
                      updateColumnType={updateColumnType} />)
                }
              </tr>
            </thead>
            <TableBody db={db} columns={columns} />
          </table>
        </ModalContent>
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
  updateColumnType: PropTypes.func.isRequired
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
      dispatch(Actions.updateColumnType(oldSchema, oldColumn, newType));
    },
    goToUpload: () => (
      dispatch(push(Links.showUpload(_.toNumber(ownProps.params.uploadId))(ownProps.location)))
    )
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowOutputSchema);

const TableBody = React.createClass({

  propTypes: {
    db: PropTypes.object.isRequired,
    columns: PropTypes.array.isRequired
  },

  shouldComponentUpdate(nextProps) {
    const currentFetchedRows = this.props.columns.map((column) => (column.fetched_rows));
    const nextFetchedRows = nextProps.columns.map((column) => (column.fetched_rows));
    return !_.isEqual(currentFetchedRows, nextFetchedRows);
  },

  render() {
    console.debug('render table');
    return (
      <tbody>
        {
          _.range(0, 20).map((rowIdx) => (
            <tr key={rowIdx}>
              {
                this.props.columns.map((column) => (
                  <td key={column.id}>
                    {_.get(this.props.db, `column_${column.id}[${rowIdx}]`, '').value}
                  </td>
                ))
              }
            </tr>
          ))
        }
      </tbody>
    );
  }

});
