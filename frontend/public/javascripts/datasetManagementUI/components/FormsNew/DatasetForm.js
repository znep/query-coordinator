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
import { shapeCustomFieldsets } from 'models/forms';
import Fieldset from 'components/FormComponents/Fieldset';
import Field from 'components/FormComponents/Field';

export class DatasetForm extends Component {
  componentWillMount() {
    // validate on mount to handle the case in which the user tries to submit
    // the form without triggering a props change (by not, e.g., typing in a form
    // field); this essentially validates the values that come from the server
    // and lets the store know about their validity
    const { regularFieldsets, customFieldsets } = this.props;

    this.validateForm(regularFieldsets, customFieldsets);
  }

  componentWillReceiveProps(nextProps) {
    const { regularFieldsets, customFieldsets } = nextProps;

    const { regularFieldsets: oldRegularFieldsets, customFieldsets: oldCustomFieldsets } = this.props;

    const oldFieldsets = [...oldRegularFieldsets, ...oldCustomFieldsets];

    const fieldsets = [...regularFieldsets, ...customFieldsets];

    if (!_.isEqual(oldFieldsets, fieldsets)) {
      this.validateForm(regularFieldsets, customFieldsets);
    }
  }

  validateForm(regularFieldsets, customFieldsets) {
    const { setErrors } = this.props;

    validateRegularFieldsets(regularFieldsets).concat(validateCustomFieldsets(customFieldsets)).matchWith({
      Success: () => setErrors([]),
      Failure: ({ value }) => setErrors(value)
    });
  }

  render() {
    const { regularFieldsets, customFieldsets } = this.props;

    const fieldsets = [...regularFieldsets, ...customFieldsets];

    return (
      <form>
        {fieldsets.map(fieldset =>
          <Fieldset title={fieldset.title} subtitle={fieldset.subtitle} key={fieldset.title}>
            {fieldset.fields.map(field => <Field field={field} fieldset={fieldset.title} key={field.name} />)}
          </Fieldset>
        )}
      </form>
    );
  }
}

DatasetForm.propTypes = {
  regularFieldsets: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      subtitle: PropTypes.string,
      fields: PropTypes.array.isRequired
    })
  ),
  customFieldsets: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      fields: PropTypes.array
    })
  ),
  setErrors: PropTypes.func.isRequired
};

const mapStateToProps = ({ entities, ui }) => {
  const { fourfour } = ui.routing;

  const view = entities.views[fourfour];

  const {
    name,
    description,
    tags,
    category,
    customMetadataFieldsets,
    licenseId,
    attribution,
    attributionLink,
    privateMetadata
  } = view;

  const email = privateMetadata ? privateMetadata.email : null;

  const customDatasetMetadata = shapeCustomFieldsets(customMetadataFieldsets, view);

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
// component. For more info/background, see discussion here:
// https://github.com/reactjs/react-redux/issues/237#issuecomment-168816713
const mergeProps = ({ fourfour, ...rest }, { dispatch }) => ({
  ...rest,
  setErrors: errors =>
    dispatch({
      type: 'EDIT_VIEW',
      id: fourfour,
      payload: { datasetMetadataErrors: errors }
    })
});

export default connect(mapStateToProps, null, mergeProps)(DatasetForm);
