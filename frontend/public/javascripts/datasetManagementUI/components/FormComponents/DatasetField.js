import React from 'react'; // eslint-disable-line no-unused-vars
import { connect } from 'react-redux';
import _ from 'lodash';
import Field from 'components/FormComponents/Field';
import * as Actions from 'actions/views';

const mapStateToProps = ({ entities, ui }, { field, fieldset }) => {
  const { fourfour } = ui.routing;

  const datasetMetadataErrors = _.get(entities, `views.${fourfour}.datasetMetadataErrors`, []);

  const errors = datasetMetadataErrors
    .filter(error => error.fieldset === fieldset && error.fieldName === field.name)
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
    setValue: value => dispatch(Actions.setValue(path, value))
  };
};

// HELPERS
function forgePath(field, fieldsetName, fourfour) {
  const isRegPrivate = f => f.isPrivate && !f.isCustom;
  const isCustomPrivate = f => f.isPrivate && f.isCustom;
  const isCustomPublic = f => !f.isPrivate && f.isCustom;

  let path;

  if (isRegPrivate(field)) {
    path = `${fourfour}.privateMetadata.${field.name}`;
  } else if (isCustomPrivate(field)) {
    path = `${fourfour}.privateMetadata.custom_fields.${fieldsetName}.${field.name}`;
  } else if (isCustomPublic(field)) {
    path = `${fourfour}.metadata.custom_fields.${fieldsetName}.${field.name}`;
  } else {
    path = `${fourfour}.${field.name}`;
  }

  return path;
}

export default connect(mapStateToProps, null, mergeProps)(Field);
