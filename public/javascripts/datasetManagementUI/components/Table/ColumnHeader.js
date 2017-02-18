import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import TypeIcon from '../TypeIcon';
import { soqlTypes, soqlProperties } from '../../lib/soqlTypes';
import * as Links from '../../links';

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

    const types = soqlTypes.map((type) => ({
      humanName: I18n.show_output_schema.column_header.type_display_names[type],
      systemName: type,
      selectable: soqlProperties[type].conversionTarget
    }));
    const orderedTypes = _.sortBy(
      _.filter(types, 'selectable'),
      'humanName'
    );
    const columnType = column.transform.output_soql_type;

    return (
      <th key={column.id} className="column-header">
        <Link to={Links.columnMetadataEditor(column.id)}>
          <span className="col-name" id={`column-display-name-${column.id}`} title={column.display_name}>
            {column.display_name}
            <span className="socrata-icon socrata-icon-edit" />
          </span>
        </Link>
        <br />
        <TypeIcon type={columnType} />
        <select
          name="col-type"
          value={columnType}
          aria-label={`col-type-${column.field_name}`}
          onChange={(event) => updateColumnType(outputSchema, column, event.target.value)}>
          {
            orderedTypes.map((type) =>
              <option key={type.systemName} value={type.systemName}>
                {type.humanName}
              </option>
            )
          }
          {column.soql_type}
        </select>
      </th>
    );
  }

});

export default ColumnHeader;