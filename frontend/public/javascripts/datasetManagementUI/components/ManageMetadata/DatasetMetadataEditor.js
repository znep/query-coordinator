import _ from 'lodash';
import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import MetadataField from '../MetadataField';
import Fieldset from 'components/MetadataFields/Fieldset';
import isEmail from 'validator/lib/isEmail';
import isURL from 'validator/lib/isURL';
import { STATUS_DIRTY } from 'lib/database/statuses';

// TODO: smarter validations, prob on form submit, and allow multiple messages (EN-14789)
export function DatasetMetadataEditor({ view, onEdit, tags }) {
  const schemaToFormfield = descriptor => {
    const fieldProps = {
      onChange: (newValue) => {
        onEdit('views', {
          id: view.id,
          [descriptor.key]: newValue
        });
      },
      descriptor,
      isPristine: view.__status__.type !== STATUS_DIRTY,
      placeholder: descriptor.placeholder,
      value: _.defaultTo(view[descriptor.key], descriptor.defaultValue)
    };
    return <MetadataField key={descriptor.key} {...fieldProps} />;
  };

  const titleDescription = [
    {
      type: 'text',
      label: I18n.edit_metadata.dataset_title,
      key: 'name',
      required: true,
      validator: name => _.trim(name).length > 0,
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
    }
  ].map(schemaToFormfield);

  const categoriesTags = [
    {
      type: 'select',
      label: I18n.edit_metadata.category,
      key: 'category',
      required: false,
      className: 'half-size',
      validator: _.constant(true),
      defaultValue: '',
      options: window.initialState.datasetCategories
    },
    {
      type: 'tagsinput',
      label: I18n.edit_metadata.tags_keywords,
      key: 'tags',
      required: false,
      className: 'half-size',
      tags: tags,
      validator: _.constant(true),
      placeholder: I18n.edit_metadata.dataset_tags,
      onChange: (newValue) => {
        onEdit('views', {
          id: view.id,
          tags: newValue
        });
      }
    }
  ].map(schemaToFormfield);

  const licensing = [
    {
      type: 'select',
      label: I18n.edit_metadata.license_type,
      key: 'licenseId',
      required: false,
      className: 'half-size',
      validator: _.constant(true),
      defaultValue: '',
      options: window.initialState.datasetLicenses
    },
    {
      type: 'text',
      label: I18n.edit_metadata.attribution,
      key: 'attribution',
      required: false,
      className: 'half-size',
      validator: _.constant(true),
      placeholder: I18n.edit_metadata.dataset_attribution,
      defaultValue: ''
    },
    {
      type: 'text',
      label: I18n.edit_metadata.attribution_link,
      key: 'attributionLink',
      required: false,
      validator: isURL,
      errorMsg: I18n.metadata_manage.dataset_tab.errors.invalid_url,
      placeholder: I18n.edit_metadata.dataset_url,
      defaultValue: ''
    }
  ].map(schemaToFormfield);

  const contact = [
    {
      type: 'text',
      label: I18n.edit_metadata.email_address,
      key: 'email',
      required: false,
      validator: isEmail,
      errorMsg: I18n.metadata_manage.dataset_tab.errors.invalid_email,
      placeholder: I18n.edit_metadata.dataset_email,
      defaultValue: ''
    }
  ].map(schemaToFormfield);

  return (
    <div id="metadata-content">
      <div id="required-note">{I18n.metadata_manage.required_note}</div>
      <form id="dataset-metadata-editor">
        <Fieldset
          title={I18n.metadata_manage.dataset_tab.titles.dataset_title}
          subtitle={I18n.metadata_manage.dataset_tab.subtitles.dataset_subtitle}>
          {titleDescription}
        </Fieldset>
        <Fieldset
          title={I18n.metadata_manage.dataset_tab.titles.tags_title}
          subtitle={I18n.metadata_manage.dataset_tab.subtitles.tags_subtitle}>
          {categoriesTags}
        </Fieldset>
        <Fieldset
          title={I18n.metadata_manage.dataset_tab.titles.licenses_title}>
          {licensing}
        </Fieldset>
        <Fieldset
          title={I18n.metadata_manage.dataset_tab.titles.contact_title}
          subtitle={I18n.metadata_manage.dataset_tab.subtitles.contact_subtitle}
          isPrivate>
          {contact}
        </Fieldset>
      </form>
    </div>
  );
}

DatasetMetadataEditor.propTypes = {
  view: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  tags: PropTypes.arrayOf(PropTypes.string)
};

const mapStateToProps = ({ db }, { view }) => ({
  tags: db.views[view.id].tags || []
});

export default connect(mapStateToProps)(DatasetMetadataEditor);
