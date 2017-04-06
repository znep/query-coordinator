import React, { PropTypes, Component } from 'react';
import { Link } from 'react-router';
import TypeIcon from '../TypeIcon';
import { soqlTypes, soqlProperties } from '../../lib/soqlTypes';
import * as Links from '../../links';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from 'styles/Table/ColumnHeader.scss';

class ColumnHeader extends Component {

  shouldComponentUpdate(nextProps) {
    return !_.isEqual(nextProps.column, this.props.column) ||
      nextProps.outputSchema.id !== this.props.outputSchema.id;
  }

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
      <th key={column.id} className={styles.columnHeader}>
        <Link to={Links.columnMetadataForm(column.id)}>
          <span
            className={styles.colName}
            data-cheetah-hook="col-name"
            id={`column-display-name-${column.id}`}
            title={column.display_name}>
            {column.display_name}
            <SocrataIcon name="edit" className={styles.icon} />
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

}

ColumnHeader.propTypes = {
  outputSchema: PropTypes.object.isRequired,
  column: PropTypes.object.isRequired,
  updateColumnType: PropTypes.func.isRequired
};

export default ColumnHeader;
