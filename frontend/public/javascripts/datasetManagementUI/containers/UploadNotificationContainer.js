import { connect } from 'react-redux';
import UploadNotification from 'components/UploadNotification/UploadNotification';

const mapStateToProps = ({ entities, ui }, { notification }) => ({
  source: entities.sources[notification.subject]
});

export default connect(mapStateToProps)(UploadNotification);
