import _ from 'lodash';
import React, { PropTypes } from 'react';
import MetadataField from '../MetadataField';

export default function DatasetMetadataEditor({ view, onEdit }) {
  const generalFields = [
    {
      type: 'text',
      label: I18n.edit_metadata.dataset_title,
      key: 'name',
      required: true,
      validator: (name) => _.trim(name).length > 0,
      errorMsg: I18n.metadata_manage.dataset_tab.errors.missing_name,
      placeholder: I18n.edit_metadata.dataset_title,
      defaultValue: ''
    },
    {
      type: 'textarea',
      label: I18n.edit_metadata.brief_description,
      key: 'description',
      required: false,
      validator: _.constant(true),
      placeholder: I18n.edit_metadata.brief_description_prompt,
      defaultValue: ''
    },
    {
      type: 'select',
      label: I18n.edit_metadata.category,
      key: 'category',
      required: false,
      validator: _.constant(true),
      defaultValue: '',
      options: window.initialState.datasetCategories
    }
  ];

  const generalFieldsHtml = generalFields.map((descriptor) => {
    const fieldProps = {
      onChange: (newValue) => {
        onEdit('views', {
          id: view.id,
          [descriptor.key]: newValue
        });
      },
      descriptor,
      value: _.defaultTo(view[descriptor.key], descriptor.defaultValue)
    };
    return <MetadataField key={descriptor.key} {...fieldProps} />;
  });

  return (
    <div id="metadata-content">
      <h2 id="tab-title">{I18n.metadata_manage.dataset_tab.title}</h2>
      <span id="tab-subtitle">{I18n.metadata_manage.dataset_tab.subtitle}</span>
      <div id="required-note">{I18n.metadata_manage.required_note}</div>
      <form id="dataset-metadata-editor">
        {generalFieldsHtml}
      </form>
    </div>
  );
}

DatasetMetadataEditor.propTypes = {
  view: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired
};
