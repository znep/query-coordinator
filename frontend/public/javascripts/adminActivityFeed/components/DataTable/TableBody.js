import PropTypes from 'prop-types';
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
  data: PropTypes.any.isRequired,

  columns: PropTypes.array.isRequired,
  rowIdGetter: PropTypes.func.isRequired,

  // an array like structure, `any` choosen considering immutablejs
  selectedRows: PropTypes.any.isRequired,

  rowComponent: PropTypes.func.isRequired,
  columnComponent: PropTypes.func.isRequired
};
