import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import _ from 'lodash';
import { makeFieldsets, validateDatasetForm } from 'models/forms';
import Fieldset from 'components/FormComponents/Fieldset';
import DatasetField from 'components/FormComponents/DatasetField';
import { setFormErrors } from 'actions/forms';

export class DatasetForm extends Component {
  componentWillMount() {
    const { regularFieldsets, customFieldsets } = this.props;

    validateDatasetForm(regularFieldsets, customFieldsets).matchWith({
      Success: () => setFormErrors('datasetForm', []),
      Failure: ({ value }) => setFormErrors('datasetForm', value)
    });
  }

  componentWillReceiveProps(nextProps) {
    const { regularFieldsets, customFieldsets, dispatch } = nextProps;

    const { regularFieldsets: oldRegularFieldsets, customFieldsets: oldCustomFieldsets } = this.props;

    const oldFieldsets = [...oldRegularFieldsets, ...oldCustomFieldsets];

    const fieldsets = [...regularFieldsets, ...customFieldsets];

    if (!_.isEqual(oldFieldsets, fieldsets)) {
      validateDatasetForm(regularFieldsets, customFieldsets).matchWith({
        Success: () => dispatch(setFormErrors('datasetForm', [])),
        Failure: ({ value }) => dispatch(setFormErrors('datasetForm', value))
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

const mapStateToProps = ({ entities }, { params }) => {
  const { fourfour } = params;

  const view = entities.views[fourfour];

  const { customMetadataFieldsets } = view;

  const revision = _.find(entities.revisions, r => r.revision_seq === _.toNumber(params.revisionSeq));

  const { regular: regularFieldsets, custom: customFieldsets } = makeFieldsets(
    revision,
    customMetadataFieldsets
  );

  return {
    regularFieldsets,
    customFieldsets
  };
};

export default withRouter(connect(mapStateToProps)(DatasetForm));
