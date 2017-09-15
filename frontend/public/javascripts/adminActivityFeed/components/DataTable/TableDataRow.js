import PropTypes from 'prop-types';
import React from 'react';

export default class TableRow extends React.Component {
  render() {
    const { item, columns, columnComponent } = this.props;

    const columnElements = columns.map(column => {
      return React.createElement(columnComponent, {
        item,
        column,
        key: column.id
      });
    });

    return React.createElement('tr', {}, columnElements);
  }
}

TableRow.propTypes = {
  // Map like data structure
  item: PropTypes.any.isRequired,

  selected: PropTypes.bool.isRequired,
  columns: PropTypes.array.isRequired,
  columnComponent: PropTypes.func.isRequired,

  id: PropTypes.any.isRequired
};
