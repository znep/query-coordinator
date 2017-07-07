/* eslint new-cap: 0 */
import daggy from 'daggy';
import _ from 'lodash';
import Validation, { Success, Failure } from 'folktale/validation';
import { hasValue, areUnique, isURL, isEmail, isValidFieldName, isValidDisplayName } from 'lib/validators';
import * as Selectors from 'selectors';

// TYPES
export const Field = daggy.taggedSum('Field', {
  Text: ['name', 'label', 'value', 'isPrivate', 'isRequired', 'placeholder', 'isCustom'],
  TextArea: ['name', 'label', 'value', 'isPrivate', 'isRequired', 'placeholder'],
  Tags: ['name', 'label', 'value', 'isPrivate', 'isRequired', 'placeholder'],
  Select: ['name', 'label', 'value', 'isPrivate', 'isRequired', 'options', 'isCustom'],
  NoField: ['name']
});

export const Fieldset = daggy.tagged('Fieldset', ['title', 'subtitle', 'fields']);

// DATASET METADATA FIELDSET DATA
// fieldsetTitleAndDesc : String -> String -> Fieldset
const fieldsetTitleAndDesc = (titleValue, descriptionValue) => {
  const fields = [
    Field.Text(
      'name',
      I18n.edit_metadata.dataset_title,
      titleValue,
      false,
      true,
      I18n.edit_metadata.dataset_title,
      false
    ),
    Field.TextArea(
      'description',
      I18n.edit_metadata.brief_description,
      descriptionValue,
      false,
      false,
      I18n.edit_metadata.brief_description_prompt
    )
  ];

  return Fieldset(
    I18n.metadata_manage.dataset_tab.titles.dataset_title,
    I18n.metadata_manage.dataset_tab.subtitles.dataset_subtitle,
    fields
  );
};

// fieldsetCategoryAndTags : String -> String -> Fieldset
const fieldsetCategoryAndTags = (categoryValue, tagsValue) => {
  const fields = [
    Field.Select(
      'category',
      I18n.edit_metadata.category,
      categoryValue,
      false,
      false,
      window.initialState.datasetCategories,
      false
    ),
    Field.Tags(
      'tags',
      I18n.edit_metadata.tags_keywords,
      tagsValue,
      false,
      false,
      I18n.edit_metadata.dataset_tags
    )
  ];

  return Fieldset(
    I18n.metadata_manage.dataset_tab.titles.tags_title,
    I18n.metadata_manage.dataset_tab.subtitles.tags_subtitle,
    fields
  );
};

// fieldsetLicense : String -> String -> String -> Fieldset
const fieldsetLicense = (licenseVal, attrVal, attrLinkVal) => {
  const fields = [
    Field.Select(
      'licenseId',
      I18n.edit_metadata.license_type,
      licenseVal,
      false,
      false,
      window.initialState.datasetLicenses,
      false
    ),
    Field.Text(
      'attribution',
      I18n.edit_metadata.attribution,
      attrVal,
      false,
      false,
      I18n.edit_metadata.dataset_attribution,
      false
    ),
    Field.Text(
      'attributionLink',
      I18n.edit_metadata.attribution_link,
      attrLinkVal,
      false,
      false,
      I18n.edit_metadata.dataset_url,
      false
    )
  ];

  return Fieldset(I18n.metadata_manage.dataset_tab.titles.licenses_title, null, fields);
};

// fieldsetEmail: String -> Fieldset
const fieldsetEmail = emailVal => {
  const fields = [
    Field.Text(
      'email',
      I18n.edit_metadata.email_address,
      emailVal,
      true,
      false,
      I18n.edit_metadata.dataset_email,
      false
    )
  ];

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

            return Field.Select(
                field.name,
                field.name,
                value,
                field.private,
                field.required,
                options,
                true
              );
          } else {
            return Field.Text(field.name, field.name, value, field.private, field.required, null, true);
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

  const email = privateMetadata ? privateMetadata.email : null;

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
    .concat(isEmail(model.email.name, model.email.value || ''))
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
const columnToFields = oc => [
  Field.Text(
    `display-name-${oc.id}`,
    I18n.metadata_manage.column_tab.name,
    oc.display_name,
    false,
    false,
    null,
    false
  ),
  Field.Text(
    `description-${oc.id}`,
    I18n.metadata_manage.column_tab.description,
    oc.description,
    false,
    false,
    null,
    false
  ),
  Field.Text(
    `field-name-${oc.id}`,
    I18n.metadata_manage.column_tab.field_name,
    oc.field_name,
    false,
    false,
    null,
    false
  )
];

// getCurrentColumns : Entities -> List OutputColumn
export const getCurrentColumns = entities => {
  const currentSchema = Selectors.latestOutputSchema(entities);

  return currentSchema ? Selectors.columnsForOutputSchema(entities, currentSchema.id) : [];
};

// makeRows : Entities -> List Field
export const makeRows = entities => _.chain(entities).thru(getCurrentColumns).map(columnToFields).value();

// COLUMN METADATA VALIDATIONS

// makeModel : Entities -> List {name: String, value: String}
const makeModel = entities =>
  _.chain(makeRows(entities))
    .flatMap(row => row.map(field => ({ name: field.name, value: field.value })))
    .value();

export const isFieldNameField = name => /^field-name/.test(name);

export const isDisplayNameField = name => /^display-name/.test(name);

// validateColumnForm : Entities -> List String
export const validateColumnForm = entities => {
  const model = makeModel(entities);

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
