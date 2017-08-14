import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { hideModal } from 'actions/modal';
import ErrorsHelp from 'components/ErrorsHelp/ErrorsHelp';

const mapStateToProps = ({ entities }, { params }) => {
  const { outputSchemaId } = params;

  return {
    errorRowCount: entities.output_schemas[outputSchemaId].error_count || 0
  };
};

const mapDispatchToProps = dispatch => ({
  onDismiss: () => dispatch(hideModal())
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ErrorsHelp));
