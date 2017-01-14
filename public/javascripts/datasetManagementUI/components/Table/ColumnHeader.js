import React, { PropTypes } from 'react';

const ColumnHeader = React.createClass({

  propTypes: {
    outputSchema: PropTypes.object.isRequired,
    column: PropTypes.object.isRequired,
    updateColumnType: PropTypes.func.isRequired
  },

  shouldComponentUpdate(nextProps) {
    return !_.isEqual(nextProps.column, this.props.column) ||
      nextProps.outputSchema.id !== this.props.outputSchema.id;
  },

  render() {
    const { outputSchema, column, updateColumnType } = this.props;
    // TODO: Refactor this to be in an appropriate location!
    const columnTypes = ['SoQLNumber', 'SoQLText'];

    return (
      <th key={column.id}>
        <span className="col-name" title={column.display_name} >
          {column.display_name}
        </span>
        <br />
        <select
          name="col-type"
          value={column.soql_type}
          onChange={(event) => updateColumnType(outputSchema, column, event.target.value)}>
          {
            columnTypes.map((type) =>
              <option key={type} value={type}>
                {I18n.show_output_schema.column_header.type_display_names[type]}
              </option>
            )
          }
          {column.soql_type}
        </select>
        <br />
        <span className="col-processed">
          {column.contiguous_rows_processed || 0} total
        </span>
      </th>
    );
  }

});

export default ColumnHeader;
