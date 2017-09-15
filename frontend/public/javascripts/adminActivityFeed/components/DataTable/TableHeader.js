import PropTypes from 'prop-types';
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
  sorting: PropTypes.shape({
    direction: PropTypes.oneOf(['asc', 'desc']).isRequired,
    column:  PropTypes.object.isRequired
  }),
  onColumnClick: PropTypes.func.isRequired,
  columns: PropTypes.array.isRequired,
  columnComponent: PropTypes.func.isRequired
};
