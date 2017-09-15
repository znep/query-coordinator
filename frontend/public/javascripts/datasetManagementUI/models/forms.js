/* eslint new-cap: 0 */
import daggy from 'lib/daggy';
import _ from 'lodash';
import Validation, { Success, Failure } from 'folktale/validation';
import { hasValue, areUnique, isURL, isEmail, isValidFieldName, isValidDisplayName } from 'lib/validators';
import * as Selectors from 'selectors';

// TYPES
const FieldDescriptor = daggy.tagged('FieldDescriptor', [
  'name',
  'value',
  'label',
  'placeholder',
  'isPrivate',
  'isRequired',
  'isCustom'
]);

export const Field = daggy.taggedSum('Field', {
  Text: ['data'],
  TextArea: ['data'],
  Tags: ['data'],
  Select: ['data', 'options'],
  NoField: ['data']
});

export const Fieldset = daggy.tagged('Fieldset', ['title', 'subtitle', 'fields']);

// DATASET METADATA FIELDSET DATA
// fieldsetTitleAndDesc : String -> String -> Fieldset
const fieldsetTitleAndDesc = (titleValue, descriptionValue) => {
  const titleDescr = FieldDescriptor(
    'name',
    titleValue,
    I18n.edit_metadata.dataset_title,
    I18n.edit_metadata.dataset_title,
    false,
    true,
    false
  );

  const descriptionDescr = FieldDescriptor(
    'description',
    descriptionValue,
    I18n.edit_metadata.brief_description,
    I18n.edit_metadata.brief_description_prompt,
    false,
    false,
    false
  );

  const fields = [Field.Text(titleDescr), Field.TextArea(descriptionDescr)];

  return Fieldset(
    I18n.metadata_manage.dataset_tab.titles.dataset_title,
    I18n.metadata_manage.dataset_tab.subtitles.dataset_subtitle,
    fields
  );
};

// fieldsetCategoryAndTags : String -> String -> Fieldset
const fieldsetCategoryAndTags = (categoryValue, tagsValue) => {
  const categoryDescr = FieldDescriptor(
    'category',
    categoryValue,
    I18n.edit_metadata.category,
    null,
    false,
    false,
    false
  );

  const tagsDescr = FieldDescriptor(
    'tags',
    tagsValue,
    I18n.edit_metadata.tags_keywords,
    I18n.edit_metadata.dataset_tags,
    false,
    false,
    false
  );

  const fields = [Field.Select(categoryDescr, window.initialState.datasetCategories), Field.Tags(tagsDescr)];

  return Fieldset(
    I18n.metadata_manage.dataset_tab.titles.tags_title,
    I18n.metadata_manage.dataset_tab.subtitles.tags_subtitle,
    fields
  );
};

// fieldsetLicense : String -> String -> String -> Fieldset
const fieldsetLicense = (licenseVal, attrVal, attrLinkVal) => {
  const licenseDescr = FieldDescriptor(
    'licenseId',
    licenseVal,
    I18n.edit_metadata.license_type,
    null,
    false,
    false,
    false
  );

  const attributionDescr = FieldDescriptor(
    'attribution',
    attrVal,
    I18n.edit_metadata.attribution,
    I18n.edit_metadata.dataset_attribution,
    false,
    false,
    false
  );

  const attributionLinkDescr = FieldDescriptor(
    'attributionLink',
    attrLinkVal,
    I18n.edit_metadata.attribution_link,
    I18n.edit_metadata.dataset_url,
    false,
    false,
    false
  );

  const fields = [
    Field.Select(licenseDescr, window.initialState.datasetLicenses),
    Field.Text(attributionDescr),
    Field.Text(attributionLinkDescr)
  ];

  return Fieldset(I18n.metadata_manage.dataset_tab.titles.licenses_title, null, fields);
};

// fieldsetEmail: String -> Fieldset
const fieldsetEmail = emailVal => {
  const emailDescr = FieldDescriptor(
    'contactEmail',
    emailVal,
    I18n.edit_metadata.email_address,
    I18n.edit_metadata.dataset_email,
    true,
    false,
    false
  );
  const fields = [Field.Text(emailDescr)];

  return Fieldset(I18n.metadata_manage.dataset_tab.titles.contact_title, null, fields);
};

// DATASET METADATA HELPERS
// shapeCustomFieldsets : Revision -> CustomFieldsets -> {[string] : Fieldset}
const shapeCustomFieldsets = (revision, customFieldsets) =>
  customFieldsets
    .map(fieldset => ({
      ...fieldset,
      fields: fieldset.fields
        ? fieldset.fields.map(field => {
            // existing values are stored on the view, so we need to look them up;
            // they are located in a different place, depending on public/private
            // status of the field
          const value = field.private
              ? _.get(revision, `metadata.privateMetadata.custom_fields.${fieldset.name}.${field.name}`, null)
              : _.get(revision, `metadata.metadata.custom_fields.${fieldset.name}.${field.name}`, null);

          const fieldData = FieldDescriptor(
              field.name,
              value,
              field.name,
              null,
              field.private,
              field.required,
              true
            );

          if (field.options) {
            const options = [
              {
                title: I18n.edit_metadata.no_selection,
                value: ''
              },
              ...field.options.map(option => ({
                title: option,
                value: option
              }))
            ];
            return Field.Select(fieldData, options);
          } else {
            return Field.Text(fieldData);
          }
        })
        : [Field.NoField(FieldDescriptor('no field', null, null, null, null, null, null))]
    }))
    .reduce(
      (acc, fieldset) => ({
        ...acc,
        [fieldset.name]: Fieldset(fieldset.name, null, fieldset.fields)
      }),
      {}
    );

// makeCustomFieldsets : Revision -> CustomFieldsets -> List Fieldset
const makeCustomFieldsets = (revision, customFieldsets) => {
  const customMetadataFieldsets = shapeCustomFieldsets(revision, customFieldsets);
  return Object.keys(customMetadataFieldsets).map(key => customMetadataFieldsets[key]);
};

// makeRegularFieldsets : Revision -> List Fieldsets
export const makeRegularFieldsets = revision => {
  const {
    name,
    description,
    tags,
    category,
    licenseId,
    attribution,
    attributionLink,
    privateMetadata
  } = revision.metadata;

  const email = privateMetadata ? privateMetadata.contactEmail : null;

  const tagsValue = tags || [];

  return [
    fieldsetTitleAndDesc(name, description),
    fieldsetCategoryAndTags(category, tagsValue),
    fieldsetLicense(licenseId, attribution, attributionLink),
    fieldsetEmail(email)
  ];
};

// makeFieldsets : Revision -> CustomFieldsets ->
//  {custom : List Fieldset, regular : List Fieldset}
export const makeFieldsets = (revision, customFieldsets) => ({
  custom: makeCustomFieldsets(revision, customFieldsets),
  regular: makeRegularFieldsets(revision)
});

// DATASET METADATA FIELDSET VALIDATIONS
// makeDataModel : Fieldset -> {[string] : String}
const makeDataModel = fieldset =>
  fieldset.fields.reduce(
    (acc, field) => ({
      ...acc,
      [field.data.name]: { value: field.data.value, name: field.data.name }
    }),
    {}
  );

// validateFieldsetTitleAndDesc : Fieldset -> Validation (List {[string] : String}) Fieldset
const validateFieldsetTitleAndDesc = fieldset => {
  const model = makeDataModel(fieldset);

  return Validation.of()
    .concat(hasValue(model.name.name, model.name.value))
    .mapFailure(f => f.map(g => ({ ...g, fieldset: fieldset.title })))
    .map(() => fieldset);
};

// validateFieldsetCategoryAndTags : Fieldset -> Validation (List {[string] : String}) Fieldset
const validateFieldsetCategoryAndTags = fieldset => {
  const model = makeDataModel(fieldset);

  const tagValue = model.tags.value || [];

  return Validation.of()
    .concat(areUnique(model.tags.name, tagValue))
    .mapFailure(f => f.map(g => ({ ...g, fieldset: fieldset.title })))
    .map(() => fieldset);
};

// validateFieldsetLicense : Fieldset -> Validation (List {[string] : String}) Fieldset
const validateFieldsetLicense = fieldset => {
  const model = makeDataModel(fieldset);

  return Validation.of()
    .concat(isURL(model.attributionLink.name, model.attributionLink.value || ''))
    .mapFailure(f => f.map(g => ({ ...g, fieldset: fieldset.title })))
    .map(() => fieldset);
};

// validateFieldsetEmail : Fieldset -> Validation (List {[string] : String}) Fieldset
const validateFieldsetEmail = fieldset => {
  const model = makeDataModel(fieldset);

  return Validation.of()
    .concat(isEmail(model.contactEmail.name, model.contactEmail.value || ''))
    .mapFailure(f => f.map(g => ({ ...g, fieldset: fieldset.title })))
    .map(() => fieldset);
};

// validateRegularFieldsets : List Fieldset -> Validation (List {[string] : String}) Fieldset
const validateRegularFieldsets = fieldsets =>
  Validation.of()
    .concat(validateFieldsetTitleAndDesc(fieldsets[0]))
    .concat(validateFieldsetCategoryAndTags(fieldsets[1]))
    .concat(validateFieldsetLicense(fieldsets[2]))
    .concat(validateFieldsetEmail(fieldsets[3]));

// validateCustomFieldset : Fieldset -> Validation (List {[string] : String}) Fieldset
const validateCustomFieldset = fieldset => {
  const validation = _.chain(fieldset.fields)
    .filter(field => !Field.NoField.is(field))
    .filter(field => field.data.isRequired)
    .map(field => hasValue(field.data.name, field.data.value))
    .flatMap(val =>
      val.matchWith({
        Success: () => [],
        Failure: x => x.value.map(f => ({ ...f, fieldset: fieldset.title }))
      })
    )
    .value();

  return validation.length ? Failure(validation) : Success(fieldset);
};

// validateCustomFieldsets : List Fieldset -> Validation (List {[string] : String}) Fieldset
const validateCustomFieldsets = fieldsets => {
  const validations = _.chain(fieldsets)
    .map(validateCustomFieldset)
    .flatMap(val =>
      val.matchWith({
        Success: () => [],
        Failure: x => x.value
      })
    )
    .value();

  return validations.length ? Failure(validations) : Success(fieldsets[fieldsets.length - 1]);
};

// validateDatasetForm : List Fieldsets -> List Fieldsets -> Validation (List {[string]: String}) Fieldset
export const validateDatasetForm = (regularFieldsets, customFieldsets) =>
  validateRegularFieldsets(regularFieldsets).concat(validateCustomFieldsets(customFieldsets));

// DATASET METADATA SERVER VALIDATION MESSAGE PARSER

const missingRequired = msg => /cannot be empty/gi.test(msg);

const missingAttribution = msg => /attribution be specified/gi.test(msg);

const badURL = msg => /not a valid url/gi.test(msg);

const badLicense = msg => /not a valid license/gi.test(msg);

const badEmail = msg => /must be a valid email/gi.test(msg);

const badCategory = msg => {
  const isInvalid = /is invalid/gi;

  if (_.isPlainObject(msg) && _.hasIn(msg, 'metadata.category') && isInvalid.test(msg.metadata.category)) {
    return true;
  } else {
    return false;
  }
};

const getRequiredFieldname = msg => /(validation failed:)(\s+View\.)(\w+)/gi.exec(msg)[3];

export const classify = msg => {
  let failure;

  if (missingRequired(msg)) {
    const fieldName = getRequiredFieldname(msg);
    // for now name is the only non-custom required field, but if that changes,
    // we need to figure out a way of getting the fieldset name; here it's just
    // hardcoded
    failure = {
      fieldName,
      fieldset: I18n.metadata_manage.dataset_tab.titles.dataset_title,
      message: I18n.edit_metadata.validation_error_required
    };
  } else if (missingAttribution(msg)) {
    failure = {
      fieldName: 'attribution',
      fieldset: I18n.metadata_manage.dataset_tab.titles.licenses_title,
      message: I18n.edit_metadata.validation_error_attribution_required
    };
  } else if (badURL(msg)) {
    failure = {
      fieldName: 'attributionLink',
      fieldset: I18n.metadata_manage.dataset_tab.titles.licenses_title,
      message: I18n.edit_metadata.validation_error_url
    };
  } else if (badLicense(msg)) {
    failure = {
      fieldName: 'licenseId',
      fieldset: I18n.metadata_manage.dataset_tab.titles.licenses_title,
      message: I18n.edit_metadata.validation_error_license
    };
  } else if (badEmail(msg)) {
    failure = {
      fieldName: 'contactEmail',
      fieldset: I18n.metadata_manage.dataset_tab.titles.contact_title,
      message: I18n.edit_metadata.validation_error_email
    };
  } else if (badCategory(msg)) {
    failure = {
      fieldName: 'categories',
      fieldset: I18n.metadata_manage.dataset_tab.titles.tags_title,
      message: I18n.edit_metadata.validation_error_category
    };
  } else {
    failure = {};
  }

  return failure;
};

// COLUMN METADATA HELPERS
// columnToField : OutputColumn -> List Field
const columnToFields = oc => {
  const displayNameData = FieldDescriptor(
    `display-name-${oc.id}`,
    oc.display_name,
    I18n.metadata_manage.column_tab.name,
    null,
    false,
    false,
    false
  );

  const descriptionData = FieldDescriptor(
    `description-${oc.id}`,
    oc.description,
    I18n.metadata_manage.column_tab.description,
    null,
    false,
    false,
    false
  );

  const fieldNameData = FieldDescriptor(
    `field-name-${oc.id}`,
    oc.field_name,
    I18n.metadata_manage.column_tab.field_name,
    null,
    false,
    false,
    false
  );

  return [Field.Text(displayNameData), Field.Text(descriptionData), Field.Text(fieldNameData)];
};

// getCurrentColumns : Number -> Entities -> List OutputColumn
export const getCurrentColumns = (outputSchemaId, entities) => {
  const outputSchema = entities.output_schemas[outputSchemaId];
  return outputSchema ? Selectors.columnsForOutputSchema(entities, outputSchemaId) : [];
};

// makeRows : Number -> Entities -> List Field
export const makeRows = (outputSchemaId, entities) =>
  _.chain(getCurrentColumns(outputSchemaId, entities)).map(columnToFields).value();

// COLUMN METADATA VALIDATIONS

// makeModel : Number -> Entities -> List {name: String, value: String}
const makeModel = (outputSchemaId, entities) =>
  _.chain(makeRows(outputSchemaId, entities))
    .flatMap(row => row.map(field => ({ name: field.data.name, value: field.data.value })))
    .value();

export const isFieldNameField = name => /^field-name/.test(name);

export const isDisplayNameField = name => /^display-name/.test(name);

// validateColumnForm : Entities -> List String
export const validateColumnForm = (outputSchemaId, entities) => {
  const model = makeModel(outputSchemaId, entities);

  const fieldNames = model.filter(field => isFieldNameField(field.name)).map(field => field.value);

  const displayNames = model.filter(field => isDisplayNameField(field.name)).map(field => field.value);

  return _.chain(model)
    .map(field => {
      if (isFieldNameField(field.name)) {
        return isValidFieldName(field.name, field.value, fieldNames);
      } else if (isDisplayNameField(field.name)) {
        return isValidDisplayName(field.name, field.value, displayNames);
      } else {
        // could validate description here
        return Success(field.value);
      }
    })
    .flatMap(val =>
      val.matchWith({
        Success: () => [],
        Failure: x => x.value
      })
    )
    .value();
};
