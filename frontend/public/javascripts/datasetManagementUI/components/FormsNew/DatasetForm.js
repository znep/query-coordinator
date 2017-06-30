import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import {
  fieldsetOne,
  fieldsetTwo,
  fieldsetThree,
  fieldsetFour,
  validateRegularFieldsets,
  validateCustomFieldsets
} from 'lib/formHelpers';

export class DatasetForm extends Component {
  componentWillReceiveProps(nextProps) {
    const { setErrors, regularFieldsets, customFieldsets } = nextProps;

    const { regularFieldsets: oldRegularFieldsets, customFieldsets: oldCustomFieldsets } = this.props;

    const oldFieldsets = [...oldRegularFieldsets, oldCustomFieldsets];

    const fieldsets = [regularFieldsets, customFieldsets];

    if (!_.isEqual(oldFieldsets, fieldsets)) {
      validateRegularFieldsets(regularFieldsets).concat(validateCustomFieldsets(customFieldsets)).matchWith({
        Success: () => setErrors([]),
        Failure: ({ value }) => setErrors(value)
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

DatasetForm.propTypes = {
  regularFieldsets: PropTypes.shape({
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    fields: PropTypes.array.isRequired
  }),
  customFieldsets: PropTypes.shape({
    title: PropTypes.string,
    fields: PropTypes.array
  }),
  setValue: PropTypes.func.isRequired
};

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

// We don't use this much, but it is a nice alternative to using the component
// as a place to put together the output of mapStateToProps and mapDispatchToProps;
// mergeProps provides a place to do this putting-together without cluttering the
// component.
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
