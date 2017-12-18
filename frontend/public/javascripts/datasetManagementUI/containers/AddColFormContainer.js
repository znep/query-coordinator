import _ from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import * as FormActions from 'reduxStuff/actions/forms';
import * as FlashActions from 'reduxStuff/actions/flashMessage';
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
    errors.push(I18n.add_col.error_not_unique);
  }

  if (!hasValue(val)) {
    errors.push(I18n.add_col.error_no_value);
  }

  if (!isValidFieldName(val)) {
    errors.push(I18n.add_col.error_invalid_name);
  }

  return errors;
}

export function validateDisplayName(val, existingDisplayNames) {
  const errors = [];

  if (!isUnique(val, existingDisplayNames)) {
    errors.push(I18n.add_col.error_not_unique);
  }

  if (!hasValue(val)) {
    errors.push(I18n.add_col.error_no_value);
  }

  return errors;
}

function shapeFormState(state) {
  return _.omit(state, ['transform', 'sourceColumnId']);
}

export const mapStateToProps = ({ ui, entities }, { params }) => {
  const isid = _.toNumber(params.inputSchemaId);
  const selectOptions = [
    { title: I18n.add_col.no_source_col, value: 'null' },
    ..._.values(entities.input_columns)
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
    selectOptions,
    entities
  };
};

const mapDispatchToProps = dispatch => ({
  syncToStore: state => dispatch(FormActions.setFormState('addColForm', shapeFormState(state))),
  markFormDirty: () => dispatch(FormActions.markFormDirty('addColForm')),
  resetFormErrors: () => dispatch(FormActions.setFormErrors('addColForm', {})),
  toggleClearInternalState: () => dispatch(FormActions.clearInternalState('addColForm', false)),
  hideFlash: () => dispatch(FlashActions.hideFlashMessage())
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AddColForm));
