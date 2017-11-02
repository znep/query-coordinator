import { connect } from 'react-redux';
import _ from 'lodash';
import HrefForm from 'components/HrefForm/HrefForm';
import { editRevision } from 'reduxStuff/actions/revisions';
import { hideFlashMessage } from 'reduxStuff/actions/flashMessage';
import * as formActions from 'reduxStuff/actions/forms';

import * as Selectors from 'selectors';

const mapStateStateToProps = ({ entities, ui }, { params }) => {
  const revision = Selectors.currentRevision(entities, _.toNumber(params.revisionSeq));

  let hrefs = [];
  let revisionId = null;

  if (revision && revision.href && Array.isArray(revision.href)) {
    hrefs = revision.href;
    revisionId = revision.id;
  }

  return {
    hrefs,
    schemaExists: !!revision.output_schema_id,
    blobExists: !!revision.blob_id,
    errors: ui.forms.hrefForm.errors,
    revisionId
  };
};

const mergeProps = (stateProps, { dispatch }, ownProps) => ({
  hrefs: stateProps.hrefs,
  errors: stateProps.errors,
  schemaExists: stateProps.schemaExists,
  blobExists: stateProps.blobExists,
  syncStateToStore: state => {
    return stateProps.revisionId == null ? _.noop : dispatch(editRevision(stateProps.revisionId, state));
  },
  markFormDirty: () => dispatch(formActions.markFormDirty('hrefForm')),
  markFormClean: () => dispatch(formActions.markFormClean('hrefForm')),
  clearFlash: () => dispatch(hideFlashMessage()),
  ...ownProps
});

export default connect(mapStateStateToProps, null, mergeProps)(HrefForm);
