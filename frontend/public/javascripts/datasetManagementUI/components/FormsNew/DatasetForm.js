import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import { Field, Fieldset } from 'lib/customMetadata';
import _ from 'lodash';
import Validation, { Success, Failure } from 'folktale/validation';
import isEmailHelper from 'validator/lib/isEmail';
import isURLHelper from 'validator/lib/isURL';

// DATA
const fieldsetOne = (titleValue, descriptionValue) => {
  const fields = [
    Field.Text(
      'name',
      I18n.edit_metadata.dataset_title,
      titleValue,
      false,
      true,
      I18n.edit_metadata.dataset_title
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

const fieldsetTwo = (categoryValue, tagsValue) => {
  const fields = [
    Field.Select(
      'category',
      I18n.edit_metadata.category,
      categoryValue,
      false,
      false,
      window.initialState.datasetCategories
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

const fieldsetThree = (licenseVal, attrVal, attrLinkVal) => {
  const fields = [
    Field.Select(
      'licenseId',
      I18n.edit_metadata.license_type,
      licenseVal,
      false,
      false,
      window.initialState.datasetLicenses
    ),
    Field.Text(
      'attribution',
      I18n.edit_metadata.attribution,
      attrVal,
      false,
      false,
      I18n.edit_metadata.dataset_attribution
    ),
    Field.Text(
      'attributionLink',
      I18n.edit_metadata.attribution_link,
      attrLinkVal,
      false,
      false,
      I18n.edit_metadata.dataset_url
    )
  ];

  return Fieldset(I18n.metadata_manage.dataset_tab.titles.licenses_title, null, fields);
};

const fieldsetFour = emailVal => {
  const fields = [
    Field.Text(
      'email',
      I18n.edit_metadata.email_address,
      emailVal,
      true,
      false,
      I18n.edit_metadata.dataset_email
    )
  ];

  return Fieldset(I18n.metadata_manage.dataset_tab.titles.contact_title, null, fields);
};

// VALIDATIONS
const makeDataModel = fieldset =>
  fieldset.fields.reduce(
    (acc, field) => ({
      ...acc,
      [field.name]: { value: field.value, name: field.name }
    }),
    {}
  );

// validateFieldsetOne : Fieldset -> Validation [{a :: String}] Fieldset
const validateFieldsetOne = fieldset => {
  const model = makeDataModel(fieldset);

  return Validation.of()
    .concat(hasValue(model.name.name, model.name.value))
    .concat(hasValue(model.description.name, model.description.value))
    .mapFailure(f => f.map(g => ({ ...g, fieldset: fieldset.title })))
    .map(() => fieldset);
};

const validateFieldsetTwo = fieldset => {
  const model = makeDataModel(fieldset);

  return Validation.of()
    .concat(isValidCategory(model.category.name, model.category.value))
    .concat(noDuplicates(model.tags.name, model.tags.value))
    .mapFailure(f => f.map(g => ({ ...g, fieldset: fieldset.title })))
    .map(() => fieldset);
};

const validateFieldsetThree = fieldset => {
  const model = makeDataModel(fieldset);

  return Validation.of()
    .concat(isURL(model.attributionLink.name, model.attributionLink.value || ''))
    .mapFailure(f => f.map(g => ({ ...g, fieldset: fieldset.title })))
    .map(() => fieldset);
};

const validateFieldsetFour = fieldset => {
  const model = makeDataModel(fieldset);

  return Validation.of()
    .concat(isEmail(model.email.name, model.email.value || ''))
    .mapFailure(f => f.map(g => ({ ...g, fieldset: fieldset.title })))
    .map(() => fieldset);
};

// validateRegularFieldsets : List Fieldset -> Validation [{a :: String}] Fieldset
const validateRegularFieldsets = fieldsets =>
  Validation.of()
    .concat(validateFieldsetOne(fieldsets[0]))
    .concat(validateFieldsetTwo(fieldsets[1]))
    .concat(validateFieldsetThree(fieldsets[2]))
    .concat(validateFieldsetFour(fieldsets[3]));

// validateCustomFieldset : Fieldset -> Validation [{a:: String}] Fieldset
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

// validateCustomFieldsets : List Fieldset -> Validation [{a :: String}] (List Fieldset)
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

  return validations.length ? Failure(validations) : Success(fieldsets);
};

function hasValue(fieldName, val) {
  return val ? Success(val) : Failure([{ [fieldName]: 'Cannot be empty' }]);
}

function isValidCategory(fieldName, val) {
  const validCategories = ['business', 'education', 'government'];
  return validCategories.includes(val) ? Success(val) : Failure([{ [fieldName]: 'Invalid Category' }]);
}

function noDuplicates(fieldName, vals) {
  return [...new Set(vals)].length === vals.length
    ? Success(vals)
    : Failure([({ fieldName }: 'Duplicate values')]);
}

function isURL(fieldName, val) {
  return isURLHelper(val, { require_protocol: true })
    ? Success(val)
    : Failure([{ [fieldName]: 'Invalid url' }]);
}

function isEmail(fieldName, val) {
  return isEmailHelper(val) ? Success(val) : Failure([{ [fieldName]: 'Invalid email' }]);
}

// COMPONENT
export class DatasetForm extends Component {
  componentWillReceiveProps(nextProps) {
    const { setErrors, regularFieldsets, customFieldsets } = nextProps;
    const { regularFieldsets: oldRegularFieldsets, customFieldsets: oldCustomFieldsets } = this.props;

    if (
      !_.isEqual(oldRegularFieldsets, regularFieldsets) ||
      !_.isEqual(oldCustomFieldsets, customFieldsets)
    ) {
      validateRegularFieldsets(regularFieldsets).concat(validateCustomFieldsets(customFieldsets)).matchWith({
        Success: x => setErrors([]),
        Failure: x => setErrors(x.value)
      });
    }
  }

  render() {
    const { regularFieldsets, customFieldsets, setValue } = this.props;
    const fieldsets = [...regularFieldsets, ...customFieldsets];
    const ui = fieldsets.map(fieldset => {
      const fields = fieldset.fields.map(field => {
        return field.cata({
          Text: () =>
            <input
              type="text"
              value={field.value || ''}
              onChange={e => setValue(field.name, e.target.value)} />,
          Tags: () => <input type="text" />,
          TextArea: () => <textarea onChange={e => setValue(field.name, e.target.value)} />,
          Select: () =>
            <select onChange={e => setValue(field.name, e.target.value)}>
              {field.options.map(opt =>
                <option>
                  {opt.value}
                </option>
              )}
            </select>
        });
      });
      return (
        <fieldset>
          <legend>
            {fieldset.title}
          </legend>
          <span>
            {fieldset.subtitle}
          </span>
          {fields}
        </fieldset>
      );
    });
    return (
      <form>
        {ui}
      </form>
    );
  }
}

const mapStateToProps = ({ entities, ui }) => {
  const { fourfour } = ui.routing;

  const view = entities.views[fourfour];

  const {
    name,
    description,
    tags,
    category,
    customDatasetMetadata,
    licenseId,
    attribution,
    attributionLink,
    privateMetadata
  } = view;

  const email = privateMetadata ? privateMetadata.email : null;

  const customFieldsets = Object.keys(customDatasetMetadata).map(key => customDatasetMetadata[key]);

  const regularFieldsets = [
    fieldsetOne(name, description),
    fieldsetTwo(category, tags),
    fieldsetThree(licenseId, attribution, attributionLink),
    fieldsetFour(email)
  ];

  return {
    regularFieldsets,
    customFieldsets,
    fourfour
  };
};

// const mapDispatchToProps = dispatch => ({
//   setValue: (path, value) =>
//     dispatch({
//       type: 'SET_VALUE',
//       path,
//       value
//     }),
//   setErrors: (fourfour, errors) =>
//     dispatch({
//       type: 'EDIT_VIEW',
//       id: fourfour,
//       payload: { datasetMetadataErrors: errors }
//     })
// });

const mergeProps = ({ fourfour, ...rest }, { dispatch }) => ({
  ...rest,
  setErrors: errors =>
    dispatch({
      type: 'EDIT_VIEW',
      id: fourfour,
      payload: { datasetMetadataErrors: errors }
    }),
  setValue: (path, value) =>
    dispatch({
      type: 'SET_VALUE',
      path: `${fourfour}.${path}`,
      value
    })
});

export default connect(mapStateToProps, null, mergeProps)(DatasetForm);
