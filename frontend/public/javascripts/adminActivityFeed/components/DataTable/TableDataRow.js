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
  item: React.PropTypes.any.isRequired,

  selected: React.PropTypes.bool.isRequired,
  columns: React.PropTypes.array.isRequired,
  columnComponent: React.PropTypes.func.isRequired,

  id: React.PropTypes.any.isRequired
};
