import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import _ from 'lodash';
import Field from 'components/Field/Field';
import { isFieldNameField, isDisplayNameField } from 'models/forms';
import * as Actions from 'actions/outputColumns';
import { editView } from 'actions/views';

/*
This component is just a more specialized version of Field. Field decides,
based on its props, what kind of form component to display--input, textarea, etc.
This component tells field how to wire that component to the store--specifically,
it points Field towards the part of the store for Column metadata. The DatasetField
does the same thing but for Dataset metadata. This allows us to use the same Field
component for both Datset and Column forms.
*/

const mapStateToProps = ({ entities, ui }, { field, params }) => {
  const { fourfour } = params;

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

export default withRouter(connect(mapStateToProps, null, mergeProps)(Field));
