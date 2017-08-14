import { connect } from 'react-redux';
import NotificationList from 'components/NotificationList/NotificationList';

const mapStateToProps = ({ ui }) => ({
  notifications: ui.notifications
});

export default connect(mapStateToProps)(NotificationList);
