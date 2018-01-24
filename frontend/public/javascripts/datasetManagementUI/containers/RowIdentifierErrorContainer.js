import { connect } from 'react-redux';
import { hideModal } from 'datasetManagementUI/reduxStuff/actions/modal';
import RowIdentifierError from 'datasetManagementUI/components/RowIdentifierError/RowIdentifierError';

function mapDispatchToProps(dispatch) {
  return {
    doCancel: () => {
      dispatch(hideModal());
    }
  };
}

export default connect(null, mapDispatchToProps)(RowIdentifierError);
