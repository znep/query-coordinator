import _ from 'lodash';
import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import MetadataField from '../MetadataField';
import * as Selectors from '../../selectors';
import * as Links from '../../links';
import styles from 'styles/ManageMetadata/ColumnMetadataEditor.scss';

function ColumnMetadataEditor({ db, onEdit }) {
  const currentSchema = Selectors.latestOutputSchema(db);
  const currentColumns = currentSchema ?
    Selectors.columnsForOutputSchema(db, currentSchema.id) :
    [];

  const columnRows = currentColumns.map(column => {
    const colNameProps = {
      onChange: (newValue) => {
        onEdit('output_columns', {
          id: column.id,
          display_name: newValue
        });
      },
      descriptor: {
        type: 'text',
        className: styles.columnName,
        key: idForColumnNameField(column.id),
        required: true,
        validator: (name) => _.trim(name).length > 0,
        errorMsg: I18n.metadata_manage.column_tab.errors.missing_name,
        placeholder: I18n.metadata_manage.column_tab.name,
        label: I18n.metadata_manage.column_tab.name,
        defaultValue: ''
      },
      value: column.display_name
    };

    const colDescProps = {
      onChange: (newValue) => {
        onEdit('output_columns', {
          id: column.id,
          description: newValue
        });
      },
      descriptor: {
        type: 'textarea',
        rows: 1,
        className: styles.columnDescription,
        key: `col-desc-${column.id}`,
        required: false,
        validator: () => true,
        placeholder: I18n.metadata_manage.column_tab.description,
        label: I18n.metadata_manage.column_tab.description,
        defaultValue: ''
      },
      value: column.description || ''
    };

    const fieldNameProps = {
      onChange: (newValue) => {
        onEdit('output_columns', {
          id: column.id,
          field_name: newValue
        });
      },
      descriptor: {
        className: styles.columnFieldName,
        type: 'text',
        key: `field-name-${column.id}`,
        required: false,
        placeholder: I18n.metadata_manage.column_tab.field_name,
        label: I18n.metadata_manage.column_tab.field_name,
        defaultValue: ''
      },
      value: column.field_name
    };

    return (
      <div className={styles.metadataRow} key={column.id}>
        <MetadataField {...colNameProps} />
        <MetadataField {...colDescProps} />
        <MetadataField {...fieldNameProps} />
      </div>
    );
  });

  const noColumnsMessage = (
    <div>
      {I18n.metadata_manage.column_tab.empty}&nbsp;
      <Link to={Links.uploads}>{I18n.metadata_manage.column_tab.upload_a_file}</Link>
    </div>
  );

  const columnEditors = (
    <form className={styles.columnMetadataEditor}>
      <div className={styles.metadataHeader}>
        <label className={styles.headerColumnName}>
          {I18n.metadata_manage.column_tab.name}
        </label>
        <label className={styles.headerColumnDescription}>
          {I18n.metadata_manage.column_tab.description}
        </label>
        <label className={styles.headerColumnFieldName}>
          {I18n.metadata_manage.column_tab.field_name}
        </label>
      </div>
      {columnRows}
    </form>
  );

  return (
    // TODO: abstract metadata content into own component
    <div className={styles.metadataContent}>
      <h2 className={styles.tabTitle}>{I18n.metadata_manage.column_tab.title}</h2>
      <span className={styles.tabSubtitle}>{I18n.metadata_manage.column_tab.subtitle}</span>
      <div className={styles.requiredNote}>{I18n.metadata_manage.required_note}</div>
      <br />
      {_.isEmpty(currentColumns) ? noColumnsMessage : columnEditors}
    </div>
  );
}

ColumnMetadataEditor.propTypes = {
  db: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired
};

const mapStateToProps = (state, ownProps) => ({
  db: state.db,
  onEdit: ownProps.onEdit
});

export default connect(mapStateToProps)(ColumnMetadataEditor);

export function idForColumnNameField(colId) {
  return `col-name-${colId}`;
}
