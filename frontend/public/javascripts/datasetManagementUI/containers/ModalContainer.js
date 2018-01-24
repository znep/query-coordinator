import { connect } from 'react-redux';
import { hideModal } from 'datasetManagementUI/reduxStuff/actions/modal';
import Modal from 'datasetManagementUI/components/Modal/Modal';

const mapStateToProps = ({ ui }) => ({
  modalState: ui.modal
});

const mapDispatchToProps = dispatch => ({
  onDismiss: () => dispatch(hideModal())
});

export default connect(mapStateToProps, mapDispatchToProps)(Modal);
