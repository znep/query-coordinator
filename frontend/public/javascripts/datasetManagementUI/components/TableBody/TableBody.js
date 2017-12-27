import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import TableCell from 'components/TableCell/TableCell';
import RowError from 'components/RowError/RowError';
import styles from './TableBody.module.scss';
import * as Selectors from 'selectors';

class TableBody extends Component {
  componentDidMount() {
    const { loadVisibleData } = this.props;
    loadVisibleData();
  }

  componentWillReceiveProps(nextProps) {
    const { loadVisibleData } = nextProps;

    loadVisibleData();
  }

  shouldComponentUpdate(nextProps) {
    const nextStuff = {
      columns: nextProps.columns.map(
        c => (c.transform ? [c.transform.id, c.transform.error_indices, c.format] : null)
      ),
      displayState: nextProps.displayState,
      apiCalls: nextProps.apiCalls,
      dropping: nextProps.dropping
    };

    const currentStuff = {
      columns: this.props.columns.map(
        c => (c.transform ? [c.transform.id, c.transform.error_indices, c.format] : null)
      ),
      displayState: this.props.displayState,
      apiCalls: this.props.apiCalls,
      dropping: this.props.dropping
    };

    return !_.isEqual(nextStuff, currentStuff);
  }

  getData() {
    return Selectors.getRowData(
      this.props.entities,
      this.props.inputSchemaId,
      this.props.displayState,
      this.props.columns
    );
  }

  renderNormalRow(row) {
    const { dropping } = this.props;

    return (
      <tr key={row.rowIdx}>
        {row.columns.map((column, offset) => {
          const t = this.props.entities.transforms[column.tid];
          const type = t ? t.output_soql_type : null;
          const hasFailed = t ? !!t.failed_at : false;
          return (
            <TableCell
              isDropping={dropping === column.id}
              key={`${row.rowIdx}-${offset}`}
              cell={column.cell}
              format={column.format}
              failed={hasFailed}
              type={type} />
          );
        })}
      </tr>
    );
  }

  render() {
    const data = this.getData();
    const rows = data.map(row => {
      return row.rowError ? <RowError key={row.rowIdx} row={row} /> : this.renderNormalRow(row);
    });

    return (
      <tbody className={styles.tableBody} tabIndex="0">
        {rows}
      </tbody>
    );
  }
}

TableBody.propTypes = {
  dropping: PropTypes.number,
  entities: PropTypes.object.isRequired,
  apiCalls: PropTypes.object.isRequired,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  displayState: PropTypes.object.isRequired,
  inputSchemaId: PropTypes.number.isRequired,
  loadVisibleData: PropTypes.func.isRequired
};

export default TableBody;
