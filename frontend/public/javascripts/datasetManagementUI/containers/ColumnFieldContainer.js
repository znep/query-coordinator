import { connect } from 'react-redux';
import _ from 'lodash';
import Field from 'components/Field/Field';
import { isFieldNameField, isDisplayNameField } from 'models/forms';
import * as ColActions from 'reduxStuff/actions/outputColumns';
import * as FormActions from 'reduxStuff/actions/forms';

/*
This component is just a more specialized version of Field. Field decides,
based on its props, what kind of form component to display--input, textarea, etc.
This component tells field how to wire that component to the store--specifically,
it points Field towards the part of the store for Column metadata. The DatasetField
does the same thing but for Dataset metadata. This allows us to use the same Field
component for both Datset and Column forms.
*/

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
      dispatch(FormActions.markFormDirty('columnForm'));
      dispatch(ColActions.editOutputColumn(id, { [propName]: value }));
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
