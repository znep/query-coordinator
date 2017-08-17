import _ from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { setFormErrors } from 'reduxStuff/actions/forms';
import { makeFieldsets } from 'models/forms';
import DatasetForm from 'components/DatasetForm/DatasetForm';

const mapStateToProps = ({ entities }, { params }) => {
  const { fourfour, revisionSeq } = params;

  const view = entities.views[fourfour];

  const { customMetadataFieldsets } = view;

  const revision = _.find(entities.revisions, r => r.revision_seq === _.toNumber(revisionSeq));

  const { regular: regularFieldsets, custom: customFieldsets } = makeFieldsets(
    revision,
    customMetadataFieldsets
  );

  return {
    regularFieldsets,
    customFieldsets
  };
};

const mapDispatchToProps = dispatch => ({
  setErrors: errors => dispatch(setFormErrors('datasetForm', errors))
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(DatasetForm));
