import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import { makeFieldsets, validateDatasetForm } from 'models/forms';
import Fieldset from 'components/FormComponents/Fieldset';
import DatasetField from 'components/FormComponents/DatasetField';

export class DatasetForm extends Component {
  componentWillReceiveProps(nextProps) {
    const { regularFieldsets, customFieldsets } = nextProps;

    const {
      regularFieldsets: oldRegularFieldsets,
      customFieldsets: oldCustomFieldsets,
      setErrors
    } = this.props;

    const oldFieldsets = [...oldRegularFieldsets, ...oldCustomFieldsets];

    const fieldsets = [...regularFieldsets, ...customFieldsets];

    if (!_.isEqual(oldFieldsets, fieldsets)) {
      validateDatasetForm(regularFieldsets, customFieldsets).matchWith({
        Success: () => setErrors([]),
        Failure: ({ value }) => setErrors(value)
      });
    }
  }

  render() {
    const { regularFieldsets, customFieldsets } = this.props;

    const fieldsets = [...regularFieldsets, ...customFieldsets];

    return (
      <form>
        {fieldsets.map(fieldset =>
          <Fieldset title={fieldset.title} subtitle={fieldset.subtitle} key={fieldset.title}>
            {fieldset.fields.map(field =>
              <DatasetField field={field} fieldset={fieldset.title} key={field.name} />
            )}
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

  const { regular: regularFieldsets, custom: customFieldsets } = makeFieldsets(view);

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
