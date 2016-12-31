import React, { PropTypes } from 'react';
import { Dropdown } from 'socrata-components';

const ColumnHeader = React.createClass({

  propTypes: {
    outputSchema: PropTypes.object.isRequired,
    column: PropTypes.object.isRequired,
    updateColumnType: PropTypes.func.isRequired
  },

  shouldComponentUpdate(nextProps) {
    return !_.isEqual(nextProps.column, this.props.column);
  },

  render() {
    const { outputSchema, column, updateColumnType } = this.props;
    // TODO: Refactor this to be in an appropriate location!
    const columnTypes = ['SoQLNumber', 'SoQLText'];
    // TODO: Internationalize!
    const typeDisplayNames = { 'SoQLText': 'Text', 'SoQLNumber': 'Number' };

    return (
      <th key={column.id}>
        <span className="col-name">
          {column.display_name}
        </span>
        <br />
        <Dropdown
          name="col-type"
          value={column.soql_type}
          onSelection={(option) => updateColumnType(outputSchema, column, option.value)}
          options={columnTypes.map(type => ({ title: typeDisplayNames[type], value: type }))} />
        <br />
        <span className="col-processed">
          {column.contiguous_rows_processed || 0} total
        </span>
      </th>
    );
  }

});

export default ColumnHeader;
