import { connect } from 'react-redux';
import { setFormErrors } from 'reduxStuff/actions/forms';
import { makeRows, validateColumnForm } from 'models/forms';
import ColumnForm from 'components/ColumnForm/ColumnForm';

const mapStateToProps = ({ entities, ui }, { outputSchemaId }) => {
  return {
    rows: makeRows(outputSchemaId, entities),
    errors: validateColumnForm(outputSchemaId, entities),
    outputSchemaId
  };
};

const mapDispatchToProps = dispatch => ({
  setErrors: errors => dispatch(setFormErrors('columnFormn', errors))
});

export default connect(mapStateToProps, mapDispatchToProps)(ColumnForm);
