import React from 'react';

export default class TableBody extends React.Component {
  render() {
    const { data, columns, selectedRows, rowIdGetter } = this.props;
    const { rowComponent, columnComponent } = this.props;

    const rows = data.map((item, index) => {
      const id = rowIdGetter(item, index);
      const selected = selectedRows.indexOf(id) >= 0;

      const key = `row-${id}`;

      return React.createElement(rowComponent, {
        id,
        key,
        item,
        selected,
        columns,
        columnComponent
      });
    });

    return React.createElement('tbody', {}, rows);
  }
}

TableBody.propTypes = {
  // an array like structure, `any` choosen considering immutablejs
  data: React.PropTypes.any.isRequired,

  columns: React.PropTypes.array.isRequired,
  rowIdGetter: React.PropTypes.func.isRequired,

  // an array like structure, `any` choosen considering immutablejs
  selectedRows: React.PropTypes.any.isRequired,

  rowComponent: React.PropTypes.func.isRequired,
  columnComponent: React.PropTypes.func.isRequired
};
