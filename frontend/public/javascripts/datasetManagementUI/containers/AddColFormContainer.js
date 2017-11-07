import { connect } from 'react-redux';
import * as FormActions from 'reduxStuff/actions/forms';
import AddColForm from 'components/AddColForm/AddColForm';

function isUnique(val, vals) {
  return !vals.includes(val);
}

function hasValue(val) {
  return !!val;
}

function isValidFieldName(val) {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(val);
}

export function validateFieldName(val, existingFieldNames) {
  const errors = [];

  if (!isUnique(val, existingFieldNames)) {
    errors.push('not unique');
  }

  if (!hasValue(val)) {
    errors.push('no value');
  }

  if (!isValidFieldName(val)) {
    errors.push('invalid name');
  }

  return errors;
}

export function validateDisplayName(val, existingDisplayNames) {
  const errors = [];

  if (!isUnique(val, existingDisplayNames)) {
    errors.push('not unique');
  }

  if (!hasValue(val)) {
    errors.push('no value');
  }

  return errors;
}

const mapStateToProps = ({ ui }) => ({
  errors: ui.forms.addColForm.errors
});

const mapDispatchToProps = dispatch => ({
  syncToStore: state => dispatch(FormActions.setFormState('addColForm', state)),
  markFormDirty: () => dispatch(FormActions.markFormDirty('addColForm'))
});

export default connect(mapStateToProps, mapDispatchToProps)(AddColForm);
