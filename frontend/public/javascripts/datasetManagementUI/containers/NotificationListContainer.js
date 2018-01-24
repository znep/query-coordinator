import { connect } from 'react-redux';
import NotificationList from 'datasetManagementUI/components/NotificationList/NotificationList';

const mapStateToProps = ({ ui }) => ({
  notifications: ui.notifications
});

export default connect(mapStateToProps)(NotificationList);
