import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import classNames from 'classnames';
import { Link, withRouter } from 'react-router';
import TypeIcon from '../TypeIcon';
import { soqlProperties } from '../../lib/soqlTypes';
import * as Links from '../../links';
import SocrataIcon from '../../../common/components/SocrataIcon';
import { Dropdown } from 'common/components';
import styles from 'styles/Table/ColumnHeader.scss';

const Translations = I18n.show_output_schema.column_header;

function DropdownWithIcon(dropdownProps) {
  const { icon, title, disabled } = dropdownProps;
  const klass = classNames(styles.colDropdownItem, { [styles.colDropdownItemDisabled]: disabled });
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
    return (
      !_.isEqual(nextProps.outputColumn, this.props.outputColumn) ||
      nextProps.outputSchema.id !== this.props.outputSchema.id ||
      nextProps.activeApiCallInvolvingThis !== this.props.activeApiCallInvolvingThis
    );
  }

  onDropColumn() {
    this.props.dropColumn();
  }

  onAddColumn() {
    this.props.addColumn();
  }

  onRowId() {
    this.props.validateThenSetRowIdentifier(this.props.outputSchema, this.props.outputColumn);
  }

  optionsFor() {
    if (this.props.outputColumn.ignored) {
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
        disabled: this.props.outputColumn.is_primary_key,
        render: DropdownWithIcon
      },
      {
        title: 'set_row_id',
        value: 'onRowId',
        icon: 'socrata-icon-question',
        disabled: this.props.outputColumn.is_primary_key,
        render: DropdownWithIcon
      }
    ];
  }

  columnType() {
    return this.props.outputColumn.transform.output_soql_type;
  }

  icon(isDisabled) {
    if (this.props.activeApiCallInvolvingThis) {
      return <span className={styles.progressSpinner} />;
    } else if (this.props.outputColumn.is_primary_key) {
      return <span className={styles.rowIdIcon} />;
    }
    return <TypeIcon type={this.columnType()} isDisabled={isDisabled} />;
  }

  render() {
    const { outputSchema, outputColumn, updateColumnType, activeApiCallInvolvingThis, location } = this.props;
    const isDisabled = outputColumn.ignored || activeApiCallInvolvingThis;

    const inputColumn = outputColumn.inputColumn;

    const inputColumnTypeInfo = soqlProperties[inputColumn.soql_type];
    const convertibleTo = _.keys(inputColumnTypeInfo.conversions);

    const types = convertibleTo.map(type => ({
      humanName: Translations.type_display_names[type.toLowerCase()],
      systemName: type
    }));

    const orderedTypes = _.sortBy(types, 'humanName');

    const dropdownProps = {
      onSelection: e => this[e.value](outputColumn),
      displayTrueWidthOptions: true,
      options: this.optionsFor(outputColumn),
      placeholder: () => {
        return <button className={styles.dropdownButton} />;
      }
    };

    const header =
      !outputColumn.transform || outputColumn.ignored
        ? <span
          className={styles.colName}
          id={`column-field-name-${outputColumn.id}`}
          title={outputColumn.display_name}>
            {outputColumn.display_name}
        </span>
        : <Link to={Links.columnMetadataForm(outputSchema.id, outputColumn.id)}>
          <span
            className={styles.colName}
            data-cheetah-hook="col-name"
            id={`column-display-name-${outputColumn.id}`}
            title={outputColumn.display_name}>
            {outputColumn.display_name}
            <SocrataIcon name="edit" className={styles.icon} />
          </span>
        </Link>;

    const className = classNames(styles.columnHeader, {
      [styles.columnHeaderDisabled]: isDisabled
    });

    return (
      <th key={outputColumn.id} className={className}>
        {header}
        <div className={styles.colDropdown}>
          <Dropdown {...dropdownProps} />
        </div>
        <br />
        {this.icon(isDisabled)}
        <select
          name="col-type"
          disabled={isDisabled}
          value={this.columnType()}
          aria-label={`col-type-${outputColumn.field_name}`}
          onChange={event => updateColumnType(outputSchema, outputColumn, event.target.value, location)}>
          {orderedTypes.map(type =>
            <option key={type.systemName} value={type.systemName}>
              {type.humanName}
            </option>
          )}
        </select>
      </th>
    );
  }
}

ColumnHeader.propTypes = {
  outputSchema: PropTypes.object.isRequired,
  outputColumn: PropTypes.object.isRequired,
  activeApiCallInvolvingThis: PropTypes.bool.isRequired,
  updateColumnType: PropTypes.func.isRequired,
  addColumn: PropTypes.func.isRequired,
  dropColumn: PropTypes.func.isRequired,
  validateThenSetRowIdentifier: PropTypes.func.isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string
  })
};

export default withRouter(ColumnHeader);
