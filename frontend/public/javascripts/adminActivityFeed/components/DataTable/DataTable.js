import _ from 'lodash';
import React from 'react';

import TableHeader from './TableHeader';
import TableHeaderColumn from './TableHeaderColumn';
import TableBody from './TableBody';
import TableDataRow from './TableDataRow';
import TableDataColumn from './TableDataColumn';

import './DataTable.scss';

export default class DataTable extends React.Component {
  render() {
    const { columns, data, rowIdGetter, selectedRows, onColumnSorted } = this.props;

    // Components
    const {
      headerColumnComponent,
      dataRowComponent,
      dataColumnComponent
    } = this.props;

    return (
      <table className="table table-condensed table-borderless data-table table-discrete">
        <TableHeader
          onSort={onColumnSorted}
          columns={columns}
          columnSorting={null}
          columnComponent={headerColumnComponent}
          />
        <TableBody
          data={data}
          columns={columns}
          rowIdGetter={rowIdGetter}
          selectedRows={selectedRows}
          rowComponent={dataRowComponent}
          columnComponent={dataColumnComponent}
          />
      </table>
    );
  }
}

DataTable.defaultProps = {
  selectedRows: [],
  condensed: true,
  headerColumnComponent: TableHeaderColumn,
  dataRowComponent: TableDataRow,
  dataColumnComponent: TableDataColumn,
  onColumnSorted: _.noop
};

DataTable.propTypes = {
  // an array like structure, `any` choosen considering immutablejs
  data: React.PropTypes.any.isRequired,
  rowIdGetter: React.PropTypes.func.isRequired,
  selectedRows: React.PropTypes.any.isRequired,
  onColumnSorted: React.PropTypes.func.isRequired
};
