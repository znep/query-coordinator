import React from 'react'; // eslint-disable-line no-unused-vars
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import _ from 'lodash';
import Field from 'components/Field/Field';
import * as Actions from 'actions/views';

// See comments in ColumnFieldContainer for a quick overview of the purpose of
// this component

const mapStateToProps = ({ entities, ui }, { field, fieldset, params }) => {
  const { fourfour } = params;

  const datasetMetadataErrors = _.get(entities, `views.${fourfour}.datasetMetadataErrors`, []);

  const errors = datasetMetadataErrors
    .filter(error => error.fieldset === fieldset && error.fieldName === field.data.name)
    .map(error => error.message);

  const showErrors = !!entities.views[fourfour].showErrors;

  return { errors, fourfour, showErrors };
};

// We don't use this much, but it is a nice alternative to using the component
// as a place to put together the output of mapStateToProps and mapDispatchToProps;
// mergeProps provides a place to do this putting-together without cluttering the
// component. For more info/background, see discussion here:
// https://github.com/reactjs/react-redux/issues/237#issuecomment-168816713
const mergeProps = ({ fourfour, ...rest }, { dispatch }, ownProps) => {
  const path = forgePath(ownProps.field, ownProps.fieldset, fourfour);

  return {
    ...rest,
    ...ownProps,
    setValue: value => {
      dispatch(Actions.editView(fourfour, { datasetFormDirty: true }));
      dispatch(Actions.setValue(path, value));
    }
  };
};

// HELPERS
function forgePath(field, fieldsetName, fourfour) {
  const isRegPrivate = f => f.data.isPrivate && !f.data.isCustom;
  const isCustomPrivate = f => f.data.isPrivate && f.data.isCustom;
  const isCustomPublic = f => !f.data.isPrivate && f.data.isCustom;

  let path;

  if (isRegPrivate(field)) {
    path = `${fourfour}.privateMetadata.${field.data.name}`;
  } else if (isCustomPrivate(field)) {
    path = `${fourfour}.privateMetadata.custom_fields.${fieldsetName}.${field.data.name}`;
  } else if (isCustomPublic(field)) {
    path = `${fourfour}.metadata.custom_fields.${fieldsetName}.${field.data.name}`;
  } else {
    path = `${fourfour}.${field.data.name}`;
  }

  return path;
}

export default withRouter(connect(mapStateToProps, null, mergeProps)(Field));
