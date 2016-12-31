import React, { PropTypes } from 'react';

export const ColumnStatus = React.createClass({
  propTypes: {
    column: PropTypes.object.isRequired
  },

  shouldComponentUpdate(nextProps) {
    return !_.isEqual(nextProps.column, this.props.column);
  },

  render() {
    const { column } = this.props;

    if (column.num_transform_errors) {
      return (
        <th key={column.id} className="col-errors">
          <div>
            <span className="error-count">{column.num_transform_errors}</span> Type Errors
          </div>
        </th>
      );
    } else {
      return (
        <th key={column.id} className="col-errors">
          <div>
            <span className="socrata-icon-checkmark3" /> All cells will import correctly
          </div>
        </th>
      );
    }
  }
});

// socrata-icon-checkmark3

export default ColumnStatus;
