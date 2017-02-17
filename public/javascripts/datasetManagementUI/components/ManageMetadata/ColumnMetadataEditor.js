import _ from 'lodash';
import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import MetadataField from '../MetadataField';
import * as Selectors from '../../selectors';
import * as Links from '../../links';

function ColumnMetadataEditor({ db, onEdit }) {
  const currentSchema = Selectors.currentOutputSchema(db);
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
        divClassName: 'column-name',
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
        divClassName: 'column-description',
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
        divClassName: 'column-field-name',
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
      <div className="metadata-row" key={column.id}>
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
    <form id="column-metadata-editor">
      <div id="metadata-header">
        <label className="block-label column-name required">
          {I18n.metadata_manage.column_tab.name}
        </label>
        <label className="block-label column-description">
          {I18n.metadata_manage.column_tab.description}
        </label>
        <label className="block-label column-field-name">
          {I18n.metadata_manage.column_tab.field_name}
        </label>
      </div>
      {columnRows}
    </form>
  );

  return (
    <div id="metadata-content">
      <h2 id="tab-title">{I18n.metadata_manage.column_tab.title}</h2>
      <span id="tab-subtitle">{I18n.metadata_manage.column_tab.subtitle}</span>
      <div id="required-note">{I18n.metadata_manage.required_note}</div>
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
