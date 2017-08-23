import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import TableCell from './TableCell';
import RowError from './RowError';
import * as DisplayState from '../../lib/displayState';
import styles from 'styles/Table/TableBody.scss';
import * as LoadDataActions from '../../actions/loadData';

class TableBody extends Component {

  componentDidMount() {
    const { displayState, dispatch } = this.props;
    dispatch(LoadDataActions.loadVisibleData(displayState));
  }

  componentWillReceiveProps(nextProps) {
    const { displayState, dispatch } = nextProps;

    dispatch(LoadDataActions.loadVisibleData(displayState));
  }

  shouldComponentUpdate(nextProps) {
    const nextStuff = {
      columns: nextProps.columns.map(c => (c.transform ? [c.transform.id, c.transform.error_indices] : null)),
      displayState: nextProps.displayState,
      apiCalls: nextProps.apiCalls
    };
    const currentStuff = {
      columns: this.props.columns.map(
        c => (c.transform ? [c.transform.id, c.transform.error_indices] : null)
      ),
      displayState: this.props.displayState,
      apiCalls: this.props.apiCalls
    };

    return !_.isEqual(nextStuff, currentStuff);
  }

  getData() {
    const props = this.props;

    const startRow = (props.displayState.pageNo - 1) * LoadDataActions.PAGE_SIZE;
    const endRow = startRow + LoadDataActions.PAGE_SIZE;
    let rowIndices;
    if (props.displayState.type === DisplayState.COLUMN_ERRORS) {
      const errorsTransform = props.entities.transforms[props.displayState.transformId];
      if (errorsTransform.error_indices) {
        rowIndices = errorsTransform.error_indices.slice(startRow, endRow);
      } else {
        rowIndices = [];
      }
    } else if (props.displayState.type === DisplayState.ROW_ERRORS) {
      rowIndices = _.filter(props.entities.row_errors, { input_schema_id: props.inputSchemaId }).map(
        rowError => rowError.offset
      );
    } else {
      rowIndices = _.range(startRow, endRow);
    }
    return rowIndices.map(rowIdx => ({
      rowIdx,
      transforms: this.props.columns.map(column => {
        const transform = column.transform;
        if (column.ignored) {
          return {
            id: `column_${column.id}`,
            cell: null
          };
        } else {
          const cell = this.props.entities.col_data[transform.id]
            ? this.props.entities.col_data[transform.id][rowIdx]
            : null;
          return {
            id: transform.id,
            cell
          };
        }
      }),
      rowError: props.entities.row_errors[`${props.inputSchemaId}-${rowIdx}`]
    }));
  }

  renderNormalRow(row) {
    return (
      <tr key={row.rowIdx}>
        {row.transforms.map((transform, offset) => {
          const t = this.props.entities.transforms[transform.id];
          const type = t ? t.output_soql_type : false;
          return (<TableCell
            key={`${row.rowIdx}-${offset}`}
            cell={transform.cell}
            type={type} />);
        })}
      </tr>
    );
  }

  render() {
    const data = this.getData();
    const rows = data.map(
      row => (row.rowError ? <RowError key={row.rowIdx} row={row} /> : this.renderNormalRow(row))
    );

    return (
      <tbody className={styles.tableBody} tabIndex="0">
        {rows}
      </tbody>
    );
  }
}

function mapStateToProps({ ui }) {
  return {
    apiCalls: ui.apiCalls
  };
}

TableBody.propTypes = {
  entities: PropTypes.object.isRequired,
  apiCalls: PropTypes.object.isRequired,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  displayState: PropTypes.object.isRequired,
  inputSchemaId: PropTypes.number.isRequired,
  dispatch: PropTypes.func.isRequired
};

export default connect(mapStateToProps)(TableBody);
