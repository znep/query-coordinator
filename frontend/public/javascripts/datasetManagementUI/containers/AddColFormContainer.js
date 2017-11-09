import _ from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
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

function shapeFormState(state) {
  return _.omit(state, ['transform', 'sourceColumnId']);
}

const mapStateToProps = ({ ui, entities }, { params }) => {
  const isid = _.toNumber(params.inputSchemaId);
  const selectOptions = [
    { title: 'No Source Column', value: 'null' },
    ...Object.values(entities.input_columns)
      .filter(ic => ic.input_schema_id === isid)
      .map(col => ({
        title: col.field_name,
        value: col.id
      }))
  ];

  return {
    errors: ui.forms.addColForm.errors,
    inputColumns: entities.input_columns,
    clearInternalState: ui.forms.addColForm.clearInternalState,
    selectOptions
  };
};

const mapDispatchToProps = dispatch => ({
  syncToStore: state => dispatch(FormActions.setFormState('addColForm', shapeFormState(state))),
  markFormDirty: () => dispatch(FormActions.markFormDirty('addColForm')),
  toggleClearInternalState: () => dispatch(FormActions.clearInternalState('addColForm', false))
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AddColForm));
