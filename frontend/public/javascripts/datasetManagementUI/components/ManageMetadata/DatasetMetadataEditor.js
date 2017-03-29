import React from 'react';
import { connect } from 'react-redux';
import isEmail from 'validator/lib/isEmail';
import isURL from 'validator/lib/isURL';
import _ from 'lodash';
import styles from 'styles/ManageMetadata/DatasetMetadataEditor.scss';

import MetadataField from 'components/MetadataField';
import Fieldset from 'components/MetadataFields/Fieldset';
import reformed from 'components/Forms/reformed';
import validateSchema from 'components/Forms/validateSchema';
import { edit } from 'actions/database';

const DatasetForm = (props) => {

  const objToField = (obj, idx) =>
    <MetadataField {...obj} key={idx} />;

  // HOC passes in helper methods / form-data to form; these methods/data are needed
  // by the form-fields, so we pass those things along using ...props
  const titleDescription = [
    {
      type: 'text',
      name: 'name',
      label: I18n.edit_metadata.dataset_title,
      placeholder: I18n.edit_metadata.dataset_title,
      ...props
    },
    {
      type: 'textarea',
      name: 'description',
      label: I18n.edit_metadata.brief_description,
      placeholder: I18n.edit_metadata.brief_description_prompt,
      ...props
    }
  ].map(objToField);

  const categoriesTags = [
    {
      type: 'select',
      name: 'category',
      label: I18n.edit_metadata.category,
      className: styles.halfSize,
      options: window.initialState.datasetCategories,
      ...props
    },
    {
      type: 'tagsinput',
      name: 'tag',
      subName: 'tags',
      label: I18n.edit_metadata.tags_keywords,
      className: styles.halfSize,
      placeholder: I18n.edit_metadata.dataset_tags,
      ...props
    }
  ].map(objToField);

  const licensing = [
    {
      type: 'select',
      name: 'licenseId',
      label: I18n.edit_metadata.license_type,
      className: styles.halfSize,
      options: window.initialState.datasetLicenses,
      ...props
    },
    {
      type: 'text',
      label: I18n.edit_metadata.attribution,
      name: 'attribution',
      className: styles.halfSize,
      placeholder: I18n.edit_metadata.dataset_attribution,
      ...props
    },
    {
      type: 'text',
      label: I18n.edit_metadata.attribution_link,
      name: 'attributionLink',
      placeholder: I18n.edit_metadata.dataset_url,
      ...props
    }
  ].map(objToField);

  const contact = [
    {
      type: 'text',
      label: I18n.edit_metadata.email_address,
      name: 'email',
      errorMsg: I18n.metadata_manage.dataset_tab.errors.invalid_email,
      placeholder: I18n.edit_metadata.dataset_email,
      ...props
    }
  ].map(objToField);

  return (
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
  );
};

// The user-defiend validation schema that we will pass to the validateSchema HOC.
// Check the validteSchema component for built-in validations you can use and how to
// add further validations. Test is a wildcard that accepts a function that returns
// either a falsey value or an error message.
const validationSchema = {
  name: {
    required: true
  },
  attributionLink: {
    test: val => {
      if (val && isURL(val, { require_protocol: true })) {
        return null;
      } else {
        return I18n.edit_metadata.validation_error_url;
      }
    }
  },
  email: {
    test: val => {
      if (val && isEmail(val)) {
        return null;
      } else {
        return I18n.edit_metadata.validation_error_email;
      }
    }
  }
};

// We need to pass initialModel as a prop to reformed HOC if we want to pre-load
// our form with data. Since these data come from the redux store, we create this
// prop here in mapStateToProps.
const mapStateToProps = ({ db, fourfour }) => {
  const view = _.get(db, `views.${fourfour}`, {});

  return {
    initialModel: {
      name: view.name,
      tags: view.tags || [],
      email: view.email,
      description: view.description,
      category: view.category,
      licenseId: view.licenseId,
      attribution: view.attribution,
      attributionLink: view.attributionLink
    },
    fourfour
  };
};

// Optional callback we can pass into reformed HOC to sync it's internal state with
// the redux store.
const mapDispatchToProps = (dispatch) => ({
  syncToStore: (id, key, val) => dispatch(edit('views', { id, [key]: val }))
});

// We want to use these higher-order components together to create data for one another.
// They follow a pattern of creating data, passing these data in as props to their wrapped
// component, and then passing that component + its new props to the next HOC. So
// connect creates initialModel, which refored uses to create model, which validateSchema
// uses to create schema.
const formWrapper = _.flowRight([
  connect(mapStateToProps, mapDispatchToProps),
  reformed,
  validateSchema(validationSchema)
]);

const ConnectedDatasetForm = formWrapper(DatasetForm);

export function DatasetMetadataEditor() {
  return (
    <div className={styles.metadataContent}>
      <div className={styles.requiredNote}>{I18n.metadata_manage.required_note}</div>
      <ConnectedDatasetForm formName="datasetMetadataForm" />
    </div>
  );
}

export default DatasetMetadataEditor;
