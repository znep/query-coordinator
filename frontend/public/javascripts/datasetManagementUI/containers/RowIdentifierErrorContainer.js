import { connect } from 'react-redux';
import { hideModal } from 'reduxStuff/actions/modal';
import RowIdentifierError from 'components/RowIdentifierError/RowIdentifierError';

function mapDispatchToProps(dispatch) {
  return {
    doCancel: () => {
      dispatch(hideModal());
    }
  };
}

export default connect(null, mapDispatchToProps)(RowIdentifierError);
