import React from 'react'; // eslint-disable-line no-unused-vars
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import _ from 'lodash';
import Field from 'components/Field/Field';
import * as FormActions from 'reduxStuff/actions/forms';
import * as RevisionActions from 'reduxStuff/actions/revisions';

// See comments in ColumnFieldContainer for a quick overview of the purpose of
// this component

const mapStateToProps = ({ entities, ui }, { field, fieldset, params }) => {
  const { revisionSeq } = params;

  const revision = _.find(entities.revisions, r => r.revision_seq === _.toNumber(revisionSeq));

  const datasetMetadataErrors = ui.forms.datasetForm.errors;

  const errors = datasetMetadataErrors
    .filter(error => error.fieldset === fieldset && error.fieldName === field.data.name)
    .map(error => error.message);

  const showErrors = !!ui.forms.datasetForm.showErrors;

  return { errors, revision, showErrors };
};

// We don't use this much, but it is a nice alternative to using the component
// as a place to put together the output of mapStateToProps and mapDispatchToProps;
// mergeProps provides a place to do this putting-together without cluttering the
// component. For more info/background, see discussion here:
// https://github.com/reactjs/react-redux/issues/237#issuecomment-168816713
const mergeProps = ({ revision, ...rest }, { dispatch }, ownProps) => {
  const path = forgePath(ownProps.field, ownProps.fieldset, revision.id);

  return {
    revision,
    ...rest,
    ...ownProps,
    setValue: value => {
      dispatch(FormActions.markFormDirty('datasetForm'));
      dispatch(RevisionActions.setRevisionValue(path, value));
    }
  };
};

// HELPERS
function forgePath(field, fieldsetName, revisionId) {
  const isRegPrivate = f => f.data.isPrivate && !f.data.isCustom;
  const isCustomPrivate = f => f.data.isPrivate && f.data.isCustom;
  const isCustomPublic = f => !f.data.isPrivate && f.data.isCustom;
  const isAttachments = field.data.name === 'attachments';

  let path;
  if (isRegPrivate(field)) {
    path = `${revisionId}.metadata.privateMetadata.${field.data.name}`;
  } else if (isCustomPrivate(field)) {
    path = `${revisionId}.metadata.privateMetadata.custom_fields.${fieldsetName}.${field.data.name}`;
  } else if (isCustomPublic(field)) {
    path = `${revisionId}.metadata.metadata.custom_fields.${fieldsetName}.${field.data.name}`;
  } else if (isAttachments) {
    path = `${revisionId}.attachments`;
  } else {
    path = `${revisionId}.metadata.${field.data.name}`;
  }

  return path;
}

export default withRouter(connect(mapStateToProps, null, mergeProps)(Field));
