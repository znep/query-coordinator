import { connect } from 'react-redux';
import * as Actions from 'actions/notifications';
import Notification from 'components/Notifications/Notification';

const mapDispatchToProps = dispatch => ({
  removeNotification: notificationId => dispatch(Actions.removeNotification(notificationId))
});

export default connect(null, mapDispatchToProps)(Notification);
