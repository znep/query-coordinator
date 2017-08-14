import { connect } from 'react-redux';
import NotificationList from 'components/Notifications/NotificationList';

const mapStateToProps = ({ ui }) => ({
  notifications: ui.notifications
});

export default connect(mapStateToProps)(NotificationList);
