import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { editView } from 'actions/views';
import { makeRows, validateColumnForm } from 'models/forms';
import ColumnForm from 'components/Forms/ColumnForm';

const mapStateToProps = ({ entities, ui }, { outputSchemaId }) => {
  return {
    rows: makeRows(outputSchemaId, entities),
    errors: validateColumnForm(outputSchemaId, entities),
    outputSchemaId
  };
};

const mergeProps = ({ outputSchemaId, errors, rows }, { dispatch }, { params }) => ({
  errors,
  rows,
  outputSchemaId,
  setErrors: () => dispatch(editView(params.fourfour, { columnMetadataErrors: errors }))
});

export default withRouter(connect(mapStateToProps, null, mergeProps)(ColumnForm));
