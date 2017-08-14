import { connect } from 'react-redux';
import UploadNotification from 'components/UploadNotification/UploadNotification';

const mapStateToProps = ({ entities, ui }, { notification }) => ({
  source: entities.sources[notification.sourceId],
  notificationId: notification.id,
  apiCall: ui.apiCalls[notification.callId]
});

export default connect(mapStateToProps)(UploadNotification);
