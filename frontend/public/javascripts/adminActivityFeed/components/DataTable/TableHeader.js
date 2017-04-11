import React from 'react';

export default class TableHeader extends React.Component {
  renderColumns() {
    const {onSort, columns, columnComponent, columnSorting} = this.props;
    const isTableSorted = columnSorting != null;

    return columns.map((column, index) => {
      const isColumnSorted = isTableSorted && columnSorting.column === column;
      const sorting = isColumnSorted ? columnSorting.sorting : 'none';

      return React.createElement(columnComponent, {
        key: `column-${index}`,
        column,
        sorting,
        onSort
      });
    });
  }

  render() {
    return (
      <thead>
        <tr>
          {this.renderColumns()}
        </tr>
      </thead>
    );
  }
}

TableHeader.propTypes = {
  columnSorting: React.PropTypes.shape({
    sorting: React.PropTypes.oneOf(['asc', 'desc']).isRequired,
    column:  React.PropTypes.object.isRequired
  }),
  onSort: React.PropTypes.func.isRequired,
  columns: React.PropTypes.array.isRequired,
  columnComponent: React.PropTypes.func.isRequired
};
