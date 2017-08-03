import React from 'react'; // eslint-disable-line no-unused-vars
import { connect } from 'react-redux';
import _ from 'lodash';
import Field from 'components/FormComponents/Field';
import { isFieldNameField, isDisplayNameField } from 'models/forms';
import * as Actions from 'actions/outputColumns';
import { editView } from 'actions/views';

const mapStateToProps = ({ entities, ui }, { field }) => {
  const { fourfour } = ui.routing;

  const errors = _.chain(entities)
    .get(`views.${fourfour}.columnMetadataErrors`, [])
    .filter(error => error.fieldName === field.data.name)
    .map(error => error.message)
    .value();

  const showErrors = !!entities.views[fourfour].showErrors;

  return { errors, fourfour, showErrors };
};

const mergeProps = ({ fourfour, ...rest }, { dispatch }, ownProps) => {
  const id = _.toNumber(ownProps.field.data.name.split('-').reverse()[0]);
  const propName = getPropName(ownProps.field.data.name);

  return {
    ...rest,
    ...ownProps,
    setValue: value => {
      dispatch(editView(fourfour, { columnFormDirty: true }));
      dispatch(Actions.editOutputColumn(id, { [propName]: value }));
    }
  };
};

function getPropName(fieldName) {
  if (isDisplayNameField(fieldName)) {
    return 'display_name';
  } else if (isFieldNameField(fieldName)) {
    return 'field_name';
  } else {
    return 'description';
  }
}

export default connect(mapStateToProps, null, mergeProps)(Field);
