import { connect } from 'react-redux';
import { hideFlashMessage } from 'reduxStuff/actions/flashMessage';
import FlashMessage from 'components/FlashMessage/FlashMessage';

const mapStateToProps = ({ ui }) => ({
  kind: ui.flashMessage.kind,
  message: ui.flashMessage.message,
  visible: ui.flashMessage.visible
});

const mapDispatchToProps = dispatch => ({
  onCloseClick: () => dispatch(hideFlashMessage())
});

export default connect(mapStateToProps, mapDispatchToProps)(FlashMessage);
