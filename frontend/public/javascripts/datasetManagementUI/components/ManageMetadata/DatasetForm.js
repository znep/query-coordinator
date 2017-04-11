import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import isEmail from 'validator/lib/isEmail';
import isURL from 'validator/lib/isURL';
import _ from 'lodash';

import MetadataField from 'components/MetadataField';
import Fieldset from 'components/MetadataFields/Fieldset';
import reformed from 'components/Forms/reformed';
import validateSchema from 'components/Forms/validateSchema';
import { edit } from 'actions/database';
import { flattenObject } from 'lib/util';
import { PRIVATE_CUSTOM_FIELD_PREFIX, CUSTOM_FIELD_PREFIX } from 'lib/customMetadata';
import styles from 'styles/ManageMetadata/DatasetForm.scss';

// HELPERS
// fns to transform custom metadata fields into the proper shape
const transformCustomField = (field, fieldsetName) => {
  const prefix = field.private ? PRIVATE_CUSTOM_FIELD_PREFIX : CUSTOM_FIELD_PREFIX;

  // in case user creates fields with the same name
  const fieldIdentifier = btoa(fieldsetName).slice(0, 6);

  let fieldConstructor = {
    type: 'text',
    name: `${prefix}-${fieldIdentifier}-${field.name}`,
    label: field.name,
    isPrivate: field.private,
    required: field.required
  };

  if (field.options) {
    const options = [
      {
        title: '-- No Selection --',
        value: ''
      },
      ...field.options.map(option => ({
        title: option,
        value: option.toUpperCase()
      }))
    ];

    fieldConstructor = {
      ...fieldConstructor,
      className: styles.halfSize,
      type: 'select',
      options
    };
  }

  return fieldConstructor;
};

const transformCustomFieldsetOne = obj => ({
  title: obj.name,
  subtitle: '',
  fields: obj.fields
});

const transformCustomFieldsetTwo = obj => ({
  ...obj,
  fields: obj.fields.map(field => transformCustomField(field, obj.title))
});

const transformCustomFieldset = _.flowRight([
  transformCustomFieldsetTwo,
  transformCustomFieldsetOne
]);

// fns to take fieldset objs and turn them into JSX
const objToField = (obj, extraProps) => {
  const fieldProps = {
    ...obj,
    ...extraProps
  };

  return <MetadataField {...fieldProps} key={obj.name} />;
};

const objToFieldset = (obj, children, idx) =>
  <Fieldset title={obj.title} subtitle={obj.subtitle} key={idx}>
    {children}
  </Fieldset>;

// DATA
// the predefined collection of fielsets and their fields
const fieldsetObjs = [
  {
    title: I18n.metadata_manage.dataset_tab.titles.dataset_title,
    subtitle: I18n.metadata_manage.dataset_tab.subtitles.dataset_subtitle,
    fields: [
      {
        type: 'text',
        name: 'name',
        label: I18n.edit_metadata.dataset_title,
        placeholder: I18n.edit_metadata.dataset_title
      },
      {
        type: 'textarea',
        name: 'description',
        label: I18n.edit_metadata.brief_description,
        placeholder: I18n.edit_metadata.brief_description_prompt
      }
    ]
  },
  {
    title: I18n.metadata_manage.dataset_tab.titles.tags_title,
    subtitle: I18n.metadata_manage.dataset_tab.subtitles.tags_subtitle,
    fields: [
      {
        type: 'select',
        name: 'category',
        label: I18n.edit_metadata.category,
        className: styles.halfSize,
        options: window.initialState.datasetCategories
      },
      {
        type: 'tagsinput',
        name: 'tag',
        subName: 'tags',
        label: I18n.edit_metadata.tags_keywords,
        className: styles.halfSize,
        placeholder: I18n.edit_metadata.dataset_tags
      }
    ]
  },
  {
    title: I18n.metadata_manage.dataset_tab.titles.licenses_title,
    subtitle: '',
    fields: [
      {
        type: 'select',
        name: 'licenseId',
        label: I18n.edit_metadata.license_type,
        className: styles.halfSize,
        options: window.initialState.datasetLicenses
      },
      {
        type: 'text',
        label: I18n.edit_metadata.attribution,
        name: 'attribution',
        className: styles.halfSize,
        placeholder: I18n.edit_metadata.dataset_attribution
      },
      {
        type: 'text',
        label: I18n.edit_metadata.attribution_link,
        name: 'attributionLink',
        placeholder: I18n.edit_metadata.dataset_url
      }
    ]
  },
  {
    title: I18n.metadata_manage.dataset_tab.titles.contact_title,
    subtitle: '',
    fields: [
      {
        type: 'text',
        label: I18n.edit_metadata.email_address,
        name: 'email',
        errorMsg: I18n.metadata_manage.dataset_tab.errors.invalid_email,
        placeholder: I18n.edit_metadata.dataset_email,
        isPrivate: true
      }
    ]
  }
];

// VALIDATIONS
// We add rules to this for custom fields in mapStateToProps
const validationRules = {
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

// Used inside mapStateToProps. Generates a validation schema for user-defined
// custom metadata fields
const createCustomValidationRules = (customFieldsets = []) => {
  return customFieldsets.reduce((acc, fieldset) => {
    const rules = fieldset.fields.reduce((innerAcc, field) => {
      if (field.required) {
        return {
          ...innerAcc,
          [field.name]: {
            required: true
          }
        };
      } else {
        return innerAcc;
      }
    }, {});

    return {
      ...acc,
      ...rules
    };
  }, {});
};

// COMPONENT
export const DatasetForm = ({ customFieldsetObjs, ...props }) => {
  const fieldsetsCombined = customFieldsetObjs
    ? fieldsetObjs.concat(customFieldsetObjs)
    : fieldsetObjs;

  const fieldsets = fieldsetsCombined
    .map(fieldsetObj => ({
      ...fieldsetObj,
      fields: fieldsetObj.fields.map(fieldObj => objToField(fieldObj, props))
    }))
    .map((fieldsetObj, idx) => objToFieldset(fieldsetObj, fieldsetObj.fields, idx));

  return (
    <form id="dataset-metadata-editor">
      {fieldsets}
    </form>
  );
};

DatasetForm.propTypes = {
  customFieldsetObjs: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      required: PropTypes.bool,
      label: PropTypes.string,
      type: PropTypes.string,
      isPrivate: PropTypes.bool
    }))
  }))
};

// We need to pass initialModel as a prop to reformed HOC if we want to pre-load
// our form with data. Since these data come from the redux store, we create this
// prop here in mapStateToProps.
const mapStateToProps = ({ db, fourfour }) => {
  const view = _.get(db, `views.${fourfour}`, {});

  const privateFields = flattenObject(view.privateMetadata);

  const customFieldsWithValues = view.metadata;

  const customFieldsetObjs = _.isEmpty(view.customMetadataFields)
    ? []
    : view.customMetadataFields.map(transformCustomFieldset);

  const customValidationRules = createCustomValidationRules(customFieldsetObjs);

  const combinedValidationRules = {
    ...customValidationRules,
    ...validationRules
  };

  return {
    initialModel: {
      name: view.name,
      tags: view.tags || [],
      email: view.email,
      description: view.description,
      category: view.category,
      licenseId: view.licenseId,
      attribution: view.attribution,
      attributionLink: view.attributionLink,
      ...privateFields,
      ...customFieldsWithValues
    },
    validationRules: combinedValidationRules,
    fourfour,
    customFieldsetObjs
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
// connect creates initialModel, which reformed uses to create model, which validateSchema
// uses to create schema.
const formWrapper = _.flowRight([
  connect(mapStateToProps, mapDispatchToProps),
  reformed,
  validateSchema()
]);

export default formWrapper(DatasetForm);
