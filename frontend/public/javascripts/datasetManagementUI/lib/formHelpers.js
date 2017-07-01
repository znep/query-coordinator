/* eslint new-cap: 0 */
import _ from 'lodash';
import Validation, { Success, Failure } from 'folktale/validation';
import { Field, Fieldset } from 'models/forms';
import { hasValue, isValidCategory, noDuplicates, isURL, isEmail } from 'lib/validators';

// DATASET METADATA FIELDSETS
// fieldsetOne : String -> String -> Fieldset
export const fieldsetOne = (titleValue, descriptionValue) => {
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

// fieldsetTwo : String -> String -> Fieldset
export const fieldsetTwo = (categoryValue, tagsValue) => {
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

// fieldsetThree : String -> String -> String -> Fieldset
export const fieldsetThree = (licenseVal, attrVal, attrLinkVal) => {
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

// fieldsetFour: String -> Fieldset
export const fieldsetFour = emailVal => {
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

// DATASET METADATA FIELDSET VALIDATIONS
// makeDataModel : String a => Fieldset -> {a : String}
const makeDataModel = fieldset =>
  fieldset.fields.reduce(
    (acc, field) => ({
      ...acc,
      [field.name]: { value: field.value, name: field.name }
    }),
    {}
  );

// validateFieldsetOne : String a => Fieldset -> Validation (List {a : String}) Fieldset
const validateFieldsetOne = fieldset => {
  const model = makeDataModel(fieldset);

  return Validation.of()
    .concat(hasValue(model.name.name, model.name.value))
    .concat(hasValue(model.description.name, model.description.value))
    .mapFailure(f => f.map(g => ({ ...g, fieldset: fieldset.title })))
    .map(() => fieldset);
};

// validateFieldsetTwo : String a => Fieldset -> Validation (List {a : String}) Fieldset
const validateFieldsetTwo = fieldset => {
  const model = makeDataModel(fieldset);

  return Validation.of()
    .concat(isValidCategory(model.category.name, model.category.value))
    .concat(noDuplicates(model.tags.name, model.tags.value))
    .mapFailure(f => f.map(g => ({ ...g, fieldset: fieldset.title })))
    .map(() => fieldset);
};

// validateFieldsetThree : String a => Fieldset -> Validation (List {a : String}) Fieldset
const validateFieldsetThree = fieldset => {
  const model = makeDataModel(fieldset);

  return Validation.of()
    .concat(isURL(model.attributionLink.name, model.attributionLink.value || ''))
    .mapFailure(f => f.map(g => ({ ...g, fieldset: fieldset.title })))
    .map(() => fieldset);
};

// validateFieldsetFour : String a => Fieldset -> Validation (List {a : String}) Fieldset
const validateFieldsetFour = fieldset => {
  const model = makeDataModel(fieldset);

  return Validation.of()
    .concat(isEmail(model.email.name, model.email.value || ''))
    .mapFailure(f => f.map(g => ({ ...g, fieldset: fieldset.title })))
    .map(() => fieldset);
};

// validateRegularFieldsets : Stirng a => List Fieldset -> Validation (List {a : String}) Fieldset
export const validateRegularFieldsets = fieldsets =>
  Validation.of()
    .concat(validateFieldsetOne(fieldsets[0]))
    .concat(validateFieldsetTwo(fieldsets[1]))
    .concat(validateFieldsetThree(fieldsets[2]))
    .concat(validateFieldsetFour(fieldsets[3]));

// validateCustomFieldset : String a => Fieldset -> Validation (List {a: String}) Fieldset
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

// validateCustomFieldsets : String a => List Fieldset -> Validation (List {a : String}) Fieldset
export const validateCustomFieldsets = fieldsets => {
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
