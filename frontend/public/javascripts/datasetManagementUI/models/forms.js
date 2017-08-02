/* eslint new-cap: 0 */
import daggy from 'lib/daggy';
import _ from 'lodash';
import Validation, { Success, Failure } from 'folktale/validation';
import { hasValue, areUnique, isURL, isEmail, isValidFieldName, isValidDisplayName } from 'lib/validators';
import * as Selectors from 'selectors';

// TYPES
const FieldData = daggy.tagged('FieldData', [
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
  NoField: ['name']
});

// export const Field = daggy.taggedSum('Field', {
//   Text: ['name', 'label', 'value', 'isPrivate', 'isRequired', 'placeholder', 'isCustom'],
//   TextArea: ['name', 'label', 'value', 'isPrivate', 'isRequired', 'placeholder'],
//   Tags: ['name', 'label', 'value', 'isPrivate', 'isRequired', 'placeholder'],
//   Select: ['name', 'label', 'value', 'isPrivate', 'isRequired', 'options', 'isCustom'],
//   NoField: ['name']
// });

export const Fieldset = daggy.tagged('Fieldset', ['title', 'subtitle', 'fields']);

// DATASET METADATA FIELDSET DATA
// fieldsetTitleAndDesc : String -> String -> Fieldset
const fieldsetTitleAndDesc = (titleValue, descriptionValue) => {
  const titleData = FieldData(
    'name',
    titleValue,
    I18n.edit_metadata.dataset_title,
    I18n.edit_metadata.dataset_title,
    false,
    true,
    false
  );

  const descriptionData = FieldData(
    'description',
    descriptionValue,
    I18n.edit_metadata.brief_description,
    I18n.edit_metadata.brief_description_prompt,
    false,
    false,
    false
  );

  const fields = [Field.Text(titleData), Field.TextArea(descriptionData)];

  return Fieldset(
    I18n.metadata_manage.dataset_tab.titles.dataset_title,
    I18n.metadata_manage.dataset_tab.subtitles.dataset_subtitle,
    fields
  );
};

// fieldsetCategoryAndTags : String -> String -> Fieldset
const fieldsetCategoryAndTags = (categoryValue, tagsValue) => {
  const categoryData = FieldData(
    'category',
    categoryValue,
    I18n.edit_metadata.category,
    null,
    false,
    false,
    false
  );

  const tagsData = FieldData(
    'tags',
    tagsValue,
    I18n.edit_metadata.tags_keywords,
    I18n.edit_metadata.dataset_tags,
    false,
    false,
    false
  );

  const fields = [Field.Select(categoryData, window.initialState.datasetCategories), Field.Tags(tagsData)];

  return Fieldset(
    I18n.metadata_manage.dataset_tab.titles.tags_title,
    I18n.metadata_manage.dataset_tab.subtitles.tags_subtitle,
    fields
  );
};

// fieldsetLicense : String -> String -> String -> Fieldset
const fieldsetLicense = (licenseVal, attrVal, attrLinkVal) => {
  const licenseData = FieldData(
    'licenseId',
    licenseVal,
    I18n.edit_metadata.license_type,
    null,
    false,
    false,
    false
  );

  const attributionData = FieldData(
    'attribution',
    attrVal,
    I18n.edit_metadata.attribution,
    I18n.edit_metadata.dataset_attribution,
    false,
    false,
    false
  );

  const attributionLinkData = FieldData(
    'attributionLink',
    attrLinkVal,
    I18n.edit_metadata.attribution_link,
    I18n.edit_metadata.dataset_url,
    false,
    false,
    false
  );

  const fields = [
    Field.Select(licenseData, window.initialState.datasetLicenses),
    Field.Text(attributionData),
    Field.Text(attributionLinkData)
  ];

  return Fieldset(I18n.metadata_manage.dataset_tab.titles.licenses_title, null, fields);
};

// fieldsetEmail: String -> Fieldset
const fieldsetEmail = emailVal => {
  const emailData = FieldData(
    'contactEmail',
    emailVal,
    I18n.edit_metadata.email_address,
    I18n.edit_metadata.dataset_email,
    true,
    false,
    false
  );
  const fields = [Field.Text(emailData)];

  return Fieldset(I18n.metadata_manage.dataset_tab.titles.contact_title, null, fields);
};

// DATASET METADATA HELPERS
// shapeCustomFieldsets : View -> {[string] : Fieldset}
const shapeCustomFieldsets = view =>
  view.customMetadataFieldsets
    .map(fieldset => ({
      ...fieldset,
      fields: fieldset.fields
        ? fieldset.fields.map(field => {
            // existing values are stored on the view, so we need to look them up;
            // they are located in a different place, depending on public/private
            // status of the field
          const value = field.private
              ? _.get(view, `privateMetadata.custom_fields.${fieldset.name}.${field.name}`, null)
              : _.get(view, `metadata.custom_fields.${fieldset.name}.${field.name}`, null);

          const fieldData = FieldData(
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
        : [Field.NoField('no field')]
    }))
    .reduce(
      (acc, fieldset) => ({
        ...acc,
        [fieldset.name]: Fieldset(fieldset.name, null, fieldset.fields)
      }),
      {}
    );

// makeCustomFieldsets : View -> List Fieldset
const makeCustomFieldsets = view => {
  const customFieldsets = shapeCustomFieldsets(view);
  return Object.keys(customFieldsets).map(key => customFieldsets[key]);
};

// makeRegularFieldsets : View -> List Fieldsets
export const makeRegularFieldsets = view => {
  const {
    name,
    description,
    tags,
    category,
    licenseId,
    attribution,
    attributionLink,
    privateMetadata
  } = view;

  const email = privateMetadata ? privateMetadata.contactEmail : null;

  return [
    fieldsetTitleAndDesc(name, description),
    fieldsetCategoryAndTags(category, tags),
    fieldsetLicense(licenseId, attribution, attributionLink),
    fieldsetEmail(email)
  ];
};

// makeFieldsets : View -> {custom : List Fieldset, regular : List Fieldset}
export const makeFieldsets = view => ({
  custom: makeCustomFieldsets(view),
  regular: makeRegularFieldsets(view)
});

// DATASET METADATA FIELDSET VALIDATIONS
// makeDataModel : Fieldset -> {[string] : String}
const makeDataModel = fieldset =>
  fieldset.fields.reduce(
    (acc, field) => ({
      ...acc,
      [field.name]: { value: field.value, name: field.name }
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

  return Validation.of()
    .concat(areUnique(model.tags.name, model.tags.value))
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
    .filter(field => field.isRequired)
    .map(field => hasValue(field.name, field.value))
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

// COLUMN METADATA HELPERS
// columnToField : OutputColumn -> List Field
const columnToFields = oc => {
  const displayNameData = FieldData(
    `display-name-${oc.id}`,
    oc.display_name,
    I18n.metadata_manage.column_tab.name,
    null,
    false,
    false,
    false
  );

  const descriptionData = FieldData(
    `description-${oc.id}`,
    oc.description,
    I18n.metadata_manage.column_tab.description,
    null,
    false,
    false,
    false
  );

  const fieldNameData = FieldData(
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
    .flatMap(row => row.map(field => ({ name: field.name, value: field.value })))
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
