import React, { PropTypes, Component } from 'react';
import classNames from 'classnames';
import { Link } from 'react-router';
import TypeIcon from '../TypeIcon';
import { soqlTypes, soqlProperties } from '../../lib/soqlTypes';
import * as Links from '../../links';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from 'styles/Table/ColumnHeader.scss';
import { Dropdown } from 'socrata-components';

const Translations = I18n.show_output_schema.column_header;

function DropdownWithIcon(dropdownProps) {
  const { icon, title, disabled } = dropdownProps;
  const klass = classNames(
    styles.colDropdownItem,
    { [styles.colDropdownItemDisabled]: disabled }
  );
  return (

    <div className={klass}>
      <SocrataIcon className={icon} name={title} />
      {Translations[title]}
    </div>
  );
}

DropdownWithIcon.proptypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired
};


class ColumnHeader extends Component {

  shouldComponentUpdate(nextProps) {
    return !_.isEqual(nextProps.column, this.props.column) ||
      nextProps.outputSchema.id !== this.props.outputSchema.id;
  }

  onDropColumn(column) {
    this.props.dropColumn(column);
  }

  onAddColumn(column) {
    this.props.addColumn(column);
  }

  onRowId() {
    console.warn('onRowId not implemented');
  }

  onColumnOptions() {
    console.warn('onColumnOptions implemented');
  }

  optionsFor() {


    if (this.props.isDisabled) {
      return [
        {
          title: 'import_column',
          value: 'onAddColumn',
          icon: 'socrata-icon-plus3',
          render: DropdownWithIcon
        },
        {
          title: 'set_row_id',
          value: 'onRowId',
          icon: 'socrata-icon-question',
          disabled: true,
          render: DropdownWithIcon
        }
      ];
    }
    return [
      {
        title: 'ignore_column',
        value: 'onDropColumn',
        icon: 'socrata-icon-eye-blocked',
        render: DropdownWithIcon
      },
      {
        title: 'set_row_id',
        value: 'onRowId',
        icon: 'socrata-icon-question',
        render: DropdownWithIcon
      }
    ];
  }

  columnType() {
    const column = this.props.column;
    if (column.transform) {
      return column.transform.output_soql_type;
    } else {
      return column.soql_type;
    }
  }


  render() {
    const { outputSchema, column, updateColumnType, isDisabled } = this.props;

    const types = soqlTypes.map((type) => ({
      humanName: Translations.type_display_names[type],
      systemName: type,
      selectable: soqlProperties[type].conversionTarget
    }));

    const orderedTypes = _.sortBy(
      _.filter(types, 'selectable'),
      'humanName'
    );

    const dropdownProps = {
      onSelection: (e) => this[e.value](column),
      displayTrueWidthOptions: true,
      options: this.optionsFor(column),
      placeholder: () => {
        return (<button className={styles.dropdownButton}></button>);
      }
    };

    const header = isDisabled ?
      (<span
        className={styles.colName}
        id={`column-field-name-${column.id}`}
        title={column.display_name}>
        {column.display_name}
      </span>) :
      (<Link to={Links.columnMetadataForm(column.id)}>
        <span
          className={styles.colName}
          data-cheetah-hook="col-name"
          id={`column-display-name-${column.id}`}
          title={column.display_name}>
          {column.display_name}
          <SocrataIcon name="edit" className={styles.icon} />
        </span>
      </Link>);

    const klass = classNames(styles.columnHeader, {
      [styles.columnHeaderDisabled]: isDisabled
    });

    return (
      <th key={column.id} className={klass}>
        {header}
        <div className={styles.colDropdown}>
          <Dropdown {...dropdownProps} />
        </div>
        <br />
        <TypeIcon type={this.columnType()} isDisabled={isDisabled} />
        <select
          name="col-type"
          disabled={isDisabled}
          value={this.columnType()}
          aria-label={`col-type-${column.field_name}`}
          onChange={(event) => updateColumnType(outputSchema, column, event.target.value)}>
          {
            orderedTypes.map((type) =>
              <option key={type.systemName} value={type.systemName}>
                {type.humanName}
              </option>
            )
          }
          // Not a real type-- simply to communicate to users that this type is coming soon!
          // TODO: remove once we support location columns
          <option key="SoQLLocation" value="SoQLLocation" disabled="true">
            {Translations.type_display_names.location_coming_soon}
          </option>
        </select>
      </th>
    );
  }
}

ColumnHeader.propTypes = {
  outputSchema: PropTypes.object.isRequired,
  column: PropTypes.object.isRequired,
  updateColumnType: PropTypes.func.isRequired,
  addColumn: PropTypes.func.isRequired,
  dropColumn: PropTypes.func.isRequired,
  isDisabled: PropTypes.bool
};

export default ColumnHeader;
