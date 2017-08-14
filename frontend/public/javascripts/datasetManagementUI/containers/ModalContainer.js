import { connect } from 'react-redux';
import { hideModal } from 'actions/modal';
import Modal from 'components/Modals/Modal';

const mapStateToProps = ({ ui }) => ({
  modalState: ui.modal
});

const mapDispatchToProps = dispatch => ({
  onDismiss: () => dispatch(hideModal())
});

export default connect(mapStateToProps, mapDispatchToProps)(Modal);
