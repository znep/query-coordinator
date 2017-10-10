import _ from 'lodash';

/* eslint react/jsx-indent: 0 */
import PropTypes from 'prop-types';

import React, { Component } from 'react';
import classNames from 'classnames';
import { Link, withRouter } from 'react-router';
import TypeIcon from 'components/TypeIcon/TypeIcon';
import { soqlProperties } from 'lib/soqlTypes';
import * as Links from 'links/links';
import SocrataIcon from '../../../common/components/SocrataIcon';
import { Dropdown } from 'common/components';
import styles from './ColumnHeader.scss';

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

export class ColumnHeader extends Component {
  shouldComponentUpdate(nextProps) {
    return (
      !_.isEqual(nextProps.outputColumn, this.props.outputColumn) ||
      nextProps.outputSchema.id !== this.props.outputSchema.id ||
      nextProps.activeApiCallInvolvingThis !== this.props.activeApiCallInvolvingThis
    );
  }

  onDropColumn() {
    // button is disabled but click handler still fires
    // so we need to guard against this stuff twice
    if (this.isDropColumnDisabled()) return;
    this.props.dropColumn();
  }

  onAddColumn() {
    this.props.addColumn();
  }

  onRowId() {
    // guard against disabled but not actually click handler
    if (this.isRowIdDisabled()) return;
    this.props.validateThenSetRowIdentifier();
  }

  onUnsetRowId() {
    // guard against disabled but not actually click handler
    if (this.isUnsetRowIdDisabled()) return;
    this.props.unSetRowIdentifier();
  }

  onGeocode() {
    this.props.showShortcut('geocode');
  }

  isDropColumnDisabled() {
    return this.isInProgress() || this.props.outputColumn.is_primary_key;
  }

  isRowIdDisabled() {
    return this.isInProgress() ||
      this.props.outputColumn.is_primary_key ||
      this.props.outputColumn.ignored;
  }

  isUnsetRowIdDisabled() {
    return this.isInProgress() ||
      !this.props.outputColumn.is_primary_key ||
      this.props.outputColumn.ignored;
  }

  isInProgress() {
    const transform = this.props.outputColumn.transform;
    if (transform) {
      return !transform.completed_at;
    }
    return false;
  }

  optionsFor() {
    const column = this.props.outputColumn;
    if (column.transform && column.transform.failed_at) {
      return [];
    }

    if (column.ignored) {
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
          icon: 'socrata-icon-id',
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
        disabled: this.isDropColumnDisabled(),
        render: DropdownWithIcon
      },
      {
        title: column.is_primary_key ? 'unset_row_id' : 'set_row_id',
        value: column.is_primary_key ? 'onUnsetRowId' : 'onRowId',
        icon: 'socrata-icon-id',
        disabled: this.isInProgress(),
        render: DropdownWithIcon
      },
      {
        title: 'geocode',
        value: 'onGeocode',
        icon: 'socrata-icon-geo',
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
    const {
      outputSchema,
      outputColumn,
      updateColumnType,
      activeApiCallInvolvingThis,
      params,
      canTransform
    } = this.props;
    const isDisabled = outputColumn.ignored || activeApiCallInvolvingThis || !canTransform;

    let convertibleTo = [];
    if (outputColumn.inputColumns.length === 1) {
      const inputColumn = outputColumn.inputColumns[0];

      const inputColumnTypeInfo = soqlProperties[inputColumn.soql_type];
      convertibleTo = _.keys(inputColumnTypeInfo.conversions);
    }

    const types = convertibleTo.map(type => ({
      humanName: Translations.type_display_names[type.toLowerCase()],
      systemName: type
    }));

    const orderedTypes = _.sortBy(types, 'humanName');

    const isSelectorDisabled = isDisabled || orderedTypes.length === 0;

    const dropdownProps = {
      onSelection: e => this[e.value](outputColumn),
      displayTrueWidthOptions: true,
      options: this.optionsFor(outputColumn),
      placeholder: () => {
        return <button className={styles.dropdownButton} />;
      }
    };

    const header =
      !outputColumn.transform || outputColumn.ignored ? (
        <span
          className={styles.colName}
          id={`column-field-name-${outputColumn.id}`}
          title={outputColumn.display_name}>
          {outputColumn.display_name}
        </span>
      ) : (
        <Link to={Links.columnMetadataForm(params, outputSchema.id, outputColumn.id)}>
          <span
            className={styles.colName}
            data-cheetah-hook="col-name"
            id={`column-display-name-${outputColumn.id}`}
            title={outputColumn.display_name}>
            {outputColumn.display_name}
            <SocrataIcon name="edit" className={styles.icon} />
          </span>
        </Link>
      );

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
          disabled={isSelectorDisabled}
          value={this.columnType()}
          aria-label={`col-type-${outputColumn.field_name}`}
          onChange={event => updateColumnType(outputSchema, outputColumn, event.target.value, params)}>
          {orderedTypes.map(type => (
            <option key={type.systemName} value={type.systemName}>
              {type.humanName}
            </option>
          ))}
        </select>
      </th>
    );
  }
}

ColumnHeader.propTypes = {
  outputSchema: PropTypes.object.isRequired,
  outputColumn: PropTypes.object.isRequired,
  activeApiCallInvolvingThis: PropTypes.bool.isRequired,
  canTransform: PropTypes.bool.isRequired,
  updateColumnType: PropTypes.func.isRequired,
  addColumn: PropTypes.func.isRequired,
  dropColumn: PropTypes.func.isRequired,
  showShortcut: PropTypes.func.isRequired,
  validateThenSetRowIdentifier: PropTypes.func.isRequired,
  unSetRowIdentifier: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired
};

export default withRouter(ColumnHeader);
