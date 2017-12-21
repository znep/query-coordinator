import { connect } from 'react-redux';
import WithFlash from 'components/WithFlash/WithFlash';

const mapStateToProps = ({ ui }) => ({
  flashVisible: ui.flashMessage.visible
});

export default connect(mapStateToProps)(WithFlash);

