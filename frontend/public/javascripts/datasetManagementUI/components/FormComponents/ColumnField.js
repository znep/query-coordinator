import React from 'react'; // eslint-disable-line no-unused-vars
import { connect } from 'react-redux';
import _ from 'lodash';
import Field from 'components/FormComponents/Field';
import { isFieldNameField, isDisplayNameField } from 'models/forms';
import { editOutputColumn } from 'actions/outputColumns';
import { markFormDirty } from 'actions/forms';

const mapStateToProps = ({ ui }, { field }) => {
  const errors = _.chain(ui.forms.columnForm.errors)
    .filter(error => error.fieldName === field.data.name)
    .map(error => error.message)
    .value();

  const showErrors = !!ui.forms.columnForm.showErrors;

  return { errors, showErrors };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const id = _.toNumber(ownProps.field.data.name.split('-').reverse()[0]);
  const propName = getPropName(ownProps.field.data.name);

  return {
    setValue: value => {
      dispatch(markFormDirty('columnForm'));
      dispatch(editOutputColumn(id, { [propName]: value }));
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

export default connect(mapStateToProps, mapDispatchToProps)(Field);
