import React from 'react';

export default class TableHeader extends React.Component {
  renderColumns() {
    const {onColumnClick, columns, columnComponent, sorting} = this.props;

    return columns.map((column, index) => {
      return React.createElement(columnComponent, {
        column,
        sorting,
        key: `column-${index}`,
        onClick: onColumnClick
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
  sorting: React.PropTypes.shape({
    direction: React.PropTypes.oneOf(['asc', 'desc']).isRequired,
    column:  React.PropTypes.object.isRequired
  }),
  onColumnClick: React.PropTypes.func.isRequired,
  columns: React.PropTypes.array.isRequired,
  columnComponent: React.PropTypes.func.isRequired
};
