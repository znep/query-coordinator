import React from 'react'; // eslint-disable-line no-unused-vars
import { connect } from 'react-redux';
import _ from 'lodash';
import Field from 'components/FormComponents/Field';
import * as Actions from 'actions/outputColumns';

const mapStateToProps = ({ entities, ui }, { field }) => {
  const { fourfour } = ui.routing;

  const errors = _.chain(entities)
    .get(`views.${fourfour}.columnMetadataErrors`, [])
    .filter(error => error.fieldName === field.name)
    .map(error => error.message)
    .value();

  const showErrors = !!entities.views[fourfour].showErrors;

  return { errors, showErrors };
};

const mergeProps = (stateProps, { dispatch }, ownProps) => {
  const id = _.toNumber(ownProps.field.name.split('-').reverse()[0]);
  const propName = getPropName(ownProps.field.name);

  return {
    ...stateProps,
    ...ownProps,
    setValue: value => dispatch(Actions.editOutputColumn(id, { [propName]: value }))
  };
};

function getPropName(fieldName) {
  if (/^display-name/.test(fieldName)) {
    return 'display_name';
  } else if (/^field-name/.test(fieldName)) {
    return 'field_name';
  } else {
    return 'description';
  }
}

export default connect(mapStateToProps, null, mergeProps)(Field);
