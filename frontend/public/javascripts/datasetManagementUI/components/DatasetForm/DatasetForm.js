import React, { PropTypes, Component } from 'react';
import _ from 'lodash';
import { validateDatasetForm } from 'models/forms';
import Fieldset from 'components/Fieldset/Fieldset';
import DatasetField from 'containers/DatasetFieldContainer';

class DatasetForm extends Component {
  componentWillMount() {
    const { setFormErrors, regularFieldsets, customFieldsets } = this.props;

    validateDatasetForm(regularFieldsets, customFieldsets).matchWith({
      Success: () => setFormErrors('datasetForm', []),
      Failure: ({ value }) => setFormErrors('datasetForm', value)
    });
  }

  componentWillReceiveProps(nextProps) {
    const { regularFieldsets, customFieldsets } = nextProps;

    const { regularFieldsets: oldRegularFieldsets, customFieldsets: oldCustomFieldsets } = this.props;

    const oldFieldsets = [...oldRegularFieldsets, ...oldCustomFieldsets];

    const fieldsets = [...regularFieldsets, ...customFieldsets];

    if (!_.isEqual(oldFieldsets, fieldsets)) {
      validateDatasetForm(regularFieldsets, customFieldsets).matchWith({
        Success: () => setFormErrors('datasetForm', []),
        Failure: ({ value }) => setFormErrors('datasetForm', value)
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
              <DatasetField field={field} fieldset={fieldset.title} key={field.data.name} />
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
  )
};

export default DatasetForm;
