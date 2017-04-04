import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import TableCell from './TableCell';
import RowError from './RowError';
import * as DisplayState from '../../lib/displayState';
import styles from 'styles/Table/TableBody.scss';

const RENDER_ROWS = 50;

class TableBody extends Component {

  shouldComponentUpdate(nextProps) {
    return !_.isEqual(
      {
        columns: nextProps.transforms.map(t => [t.id, t.fetched_rows, t.error_indices]),
        displayState: nextProps.displayState,
        numRowErrors: _.size(nextProps.db.row_errors)
      },
      {
        columns: this.props.transforms.map(t => [t.id, t.fetched_rows, t.error_indices]),
        displayState: this.props.displayState,
        numRowErrors: _.size(this.props.db.row_errors)
      }
    );
  }

  getData() {
    const props = this.props;
    const transformTables = props.transforms.map((transform) => (
      props.db[`transform_${transform.id}`]
    ));
    let rowIndices;
    if (props.displayState.type === DisplayState.COLUMN_ERRORS) {
      const errorsTransform = props.db.transforms[props.displayState.transformId];
      rowIndices = errorsTransform.error_indices || _.range(RENDER_ROWS);
    } else if (props.displayState.type === DisplayState.ROW_ERRORS) {
      rowIndices = _.filter(props.db.row_errors, { input_schema_id: props.inputSchemaId }).
        map((rowError) => rowError.offset);
    } else {
      rowIndices = _.range(0, RENDER_ROWS);
    }
    return rowIndices.map((rowIdx) => ({
      rowIdx,
      transforms: props.transforms.map((transform, transformIdx) => {
        const cell = transformTables[transformIdx][rowIdx];
        return {
          id: transform.id,
          cell
        };
      }),
      rowError: props.db.row_errors[`${props.inputSchemaId}-${rowIdx}`]
    }));
  }

  renderNormalRow(row) {
    return (
      <tr key={row.rowIdx}>
        {row.transforms.map(transform => <TableCell key={transform.id} cell={transform.cell} />)}
      </tr>);
  }

  render() {
    const data = this.getData();
    const rows = data.map(row => (
      row.rowError ? <RowError key={row.rowIdx} rowError={row.rowError} /> : this.renderNormalRow(row)
    ));

    return (
      <tbody className={styles.tableBody} tabIndex="0">
        {rows}
      </tbody>
    );
  }

}

TableBody.propTypes = {
  db: PropTypes.object.isRequired,
  transforms: PropTypes.arrayOf(PropTypes.object).isRequired,
  displayState: PropTypes.object.isRequired,
  inputSchemaId: PropTypes.number.isRequired
};

export default TableBody;
