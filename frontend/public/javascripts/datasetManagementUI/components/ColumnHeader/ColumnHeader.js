/* eslint react/jsx-indent: 0 */
import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Link, browserHistory } from 'react-router';
import TypeIcon from 'datasetManagementUI/components/TypeIcon/TypeIcon';
import { soqlProperties } from 'datasetManagementUI/lib/soqlTypes';
import * as Links from 'datasetManagementUI/links/links';
import SocrataIcon from '../../../common/components/SocrataIcon';
import * as ModalActions from 'datasetManagementUI/reduxStuff/actions/modal';
import * as FlashActions from 'datasetManagementUI/reduxStuff/actions/flashMessage';
import * as ShowActions from 'datasetManagementUI/reduxStuff/actions/showOutputSchema';
import { Dropdown } from 'common/components';
import styles from './ColumnHeader.module.scss';

const Translations = I18n.show_output_schema.column_header;

function DropdownWithIcon(dropdownProps) {
  const { icon, title, disabled } = dropdownProps;
  const classNames = [styles.colDropdownItem];

  if (disabled) {
    classNames.push(styles.colDropdownItemDisabled);
  }

  return (
    <div className={classNames.join(' ')}>
      <SocrataIcon className={icon} name={title} />
      {Translations[title]}
    </div>
  );
}

DropdownWithIcon.proptypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired
};

function RedirectError() {
  this.name = 'RedirectError';
  this.message = I18n.show_output_schema.redirect_error;
}

RedirectError.prototype = new Error();

const redirectToNewOutputschema = (dispatch, params) => resp => {
  if (resp && resp.resource) {
    dispatch(ShowActions.redirectToOutputSchema(params, resp.resource.id));
  } else {
    throw new RedirectError();
  }
};

export class ColumnHeader extends Component {
  constructor(props) {
    super(props);

    this.dropColumn = this.dropColumn.bind(this);
    this.validateThenSetRowIdentifier = this.validateThenSetRowIdentifier.bind(this);
    this.unSetRowIdentifier = this.unSetRowIdentifier.bind(this);
    this.moveLeft = this.moveLeft.bind(this);
    this.moveRight = this.moveRight.bind(this);
    this.formatColumn = this.formatColumn.bind(this);
    this.updateColumnType = this.updateColumnType.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    return (
      nextProps.outputColumn.transform.finished_at !== this.props.outputColumn.transform.finished_at ||
      nextProps.outputSchema.id !== this.props.outputSchema.id ||
      nextProps.isDropping !== this.props.isDropping ||
      nextProps.activeApiCallInvolvingThis !== this.props.activeApiCallInvolvingThis
    );
  }

  onDropColumn() {
    // button is disabled but click handler still fires
    // so we need to guard against this stuff twice
    if (this.isDropColumnDisabled()) {
      return;
    }

    this.dropColumn();
  }

  onRowId() {
    // guard against disabled but not actually click handler
    if (this.isRowIdDisabled()) {
      return;
    }

    this.validateThenSetRowIdentifier();
  }

  onUnsetRowId() {
    // guard against disabled but not actually click handler
    if (this.isUnsetRowIdDisabled()) return;
    this.unSetRowIdentifier();
  }

  onMoveLeft() {
    if (this.isMoveLeftDisabled()) return;
    this.moveLeft();
  }

  onMoveRight() {
    if (this.isMoveRightDisabled()) {
      return;
    }
    this.moveRight();
  }

  onFormatColumn() {
    if (this.isFormatDisabled()) {
      return;
    }
    this.formatColumn();
  }

  onTransform() {
    if (this.isTransformDisabled()) return;
    browserHistory.push(Links.transformColumn(
      this.props.params,
      this.props.params.sourceId,
      this.props.params.inputSchemaId,
      this.props.params.outputSchemaId,
      this.props.outputColumn.id
    ));
  }

  isDropColumnDisabled() {
    return this.props.outputColumn.is_primary_key;
  }

  isRowIdDisabled() {
    return this.isInProgress() || this.props.outputColumn.is_primary_key;
  }

  isUnsetRowIdDisabled() {
    return this.isInProgress() || !this.props.outputColumn.is_primary_key;
  }

  isMoveLeftDisabled() {
    return this.props.outputColumn.position <= 1;
  }

  isMoveRightDisabled() {
    return this.props.outputColumn.position >= this.props.columnCount;
  }

  isFormatDisabled() {
    return false;
  }

  dropColumn() {
    const { dispatch, params, outputSchema, outputColumn } = this.props;

    this.props.setDropping();
    return dispatch(ShowActions.dropColumn(outputSchema, outputColumn))
      .then(redirectToNewOutputschema(dispatch, params))
      .then(this.props.resetDropping)
      .catch(e => {
        if (e.name === 'RedirectError') {
          dispatch(FlashActions.showFlashMessage('error', e.message));
        } else {
          dispatch(
            FlashActions.showFlashMessage('error', I18n.show_output_schema.fatal_error.unknown_error)
          );
        }
      });
  }

  updateColumnType(newType) {
    const { dispatch, params, outputSchema, outputColumn } = this.props;

    return dispatch(
      ShowActions.updateColumnType(outputSchema, outputColumn, newType)
    ).then(
      redirectToNewOutputschema(dispatch, params)
    );
  }

  validateThenSetRowIdentifier() {
    const { dispatch, params, outputSchema, outputColumn } = this.props;

    return dispatch(
      ShowActions.validateThenSetRowIdentifier(outputSchema, outputColumn)
    ).then(
      redirectToNewOutputschema(dispatch, params)
    );
  }

  unSetRowIdentifier() {
    const { dispatch, params, outputSchema } = this.props;

    return dispatch(
      ShowActions.unsetRowIdentifier(outputSchema)
    ).then(
      redirectToNewOutputschema(dispatch, params)
    );
  }

  moveLeft() {
    const { dispatch, params, outputSchema, outputColumn } = this.props;

    return dispatch(
      ShowActions.moveColumnToPosition(outputSchema, outputColumn, outputColumn.position - 1)
    ).then(
      redirectToNewOutputschema(dispatch, params)
    );
  }

  moveRight() {
    const { dispatch, params, outputSchema, outputColumn } = this.props;

    return dispatch(
      ShowActions.moveColumnToPosition(outputSchema, outputColumn, outputColumn.position + 1)
    ).then(
      redirectToNewOutputschema(dispatch, params)
    );
  }

  formatColumn() {
    const { dispatch, params, outputSchema, outputColumn } = this.props;

    return dispatch(
      ModalActions.showModal('FormatColumn', {
        outputSchema,
        outputColumn,
        params
      })
    );
  }

  isInProgress() {
    const transform = this.props.outputColumn.transform;
    if (transform) {
      return !transform.finished_at;
    }
    return false;
  }

  isTransformDisabled() {
    return false;
  }

  optionsFor() {
    const column = this.props.outputColumn;
    if (column.transform && column.transform.failed_at) {
      return [];
    }

    return [
      {
        title: 'formatting',
        value: 'onFormatColumn',
        icon: 'socrata-icon-paragraph-left',
        disabled: this.isFormatDisabled(),
        render: DropdownWithIcon
      },
      {
        title: 'data_transforms',
        value: 'onTransform',
        icon: 'socrata-icon-embed',
        disabled: this.isTransformDisabled(),
        render: DropdownWithIcon
      },
      {
        title: 'drop_column',
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
        title: 'move_left',
        value: 'onMoveLeft',
        disabled: this.isMoveLeftDisabled(),
        icon: 'socrata-icon-arrow-prev',
        render: DropdownWithIcon
      },
      {
        title: 'move_right',
        value: 'onMoveRight',
        disabled: this.isMoveRightDisabled(),
        icon: 'socrata-icon-arrow-next',
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
      activeApiCallInvolvingThis,
      params,
      canTransform,
      isDropping
    } = this.props;

    const isDisabled = activeApiCallInvolvingThis || !canTransform;
    let isSelectorDisabled = isDisabled;
    let convertibleTo = [];

    // Simple case of only transforming via the selection dropdown
    if (outputColumn.inputColumns.length === 1) {
      const inputColumn = outputColumn.inputColumns[0];

      const inputColumnTypeInfo = soqlProperties[inputColumn.soql_type];
      convertibleTo = Object.keys(inputColumnTypeInfo.conversions);

      isSelectorDisabled = isSelectorDisabled || convertibleTo.length === 0;
    } else {
      // More complex case: someone has a transform which
      // was made through the geocoding dialog or transform editor
      // This means the simple to_text/to_number/etc transforms must be disabled,
      // so we disable the selector
      isSelectorDisabled = true;
      // and then say we can convert to ourself so the selector at least has a title
      convertibleTo.push(this.columnType());
    }

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
        return (
          <button className="dropdown-btn btn btn-xs btn-simple socrata-icon-kebab">
            <span className="accessibility-text">Dropdown Menu</span>
          </button>
        );
      }
    };

    const header = !outputColumn.transform ? (
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

    const classNames = [styles.columnHeader, 'column-header'];

    if (isDisabled) {
      classNames.push(styles.columnHeaderDisabled);
    }

    if (isDropping) {
      classNames.push(styles.dropping);
    }

    return (
      <th key={outputColumn.id} className={classNames.join(' ')}>
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
          onChange={event => this.updateColumnType(event.target.value)}>
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
  isDropping: PropTypes.bool,
  dispatch: PropTypes.func,
  setDropping: PropTypes.func,
  resetDropping: PropTypes.func,
  outputSchema: PropTypes.object.isRequired,
  outputColumn: PropTypes.object.isRequired,
  activeApiCallInvolvingThis: PropTypes.bool.isRequired,
  canTransform: PropTypes.bool.isRequired,
  columnCount: PropTypes.number.isRequired,
  params: PropTypes.object.isRequired
};

export default ColumnHeader;
