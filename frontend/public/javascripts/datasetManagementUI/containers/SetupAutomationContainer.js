import { connect } from 'react-redux';
import { hideModal } from 'reduxStuff/actions/modal';
import SetupAutomation from 'components/SetupAutomation/SetupAutomation';

function mapStateToProps(state, props) {
  return props;
}

function mapDispatchToProps(dispatch) {
  return {
    onDismiss: () => dispatch(hideModal())
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SetupAutomation);
