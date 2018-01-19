import { connect } from 'react-redux';
import * as Actions from 'datasetManagementUI/reduxStuff/actions/notifications';
import Notification from 'datasetManagementUI/components/Notification/Notification';

const mapDispatchToProps = dispatch => ({
  removeNotification: notificationId => dispatch(Actions.removeNotification(notificationId))
});

export default connect(null, mapDispatchToProps)(Notification);
