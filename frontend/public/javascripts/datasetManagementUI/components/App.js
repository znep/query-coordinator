import React, { PropTypes } from 'react';
import AppBar from './AppBar';
import NotificationList from 'components/Notifications/NotificationListContainer';
import Modal from 'components/Modals/ModalContainer';
import styles from 'styles/App.scss';

const App = ({ children }) =>
  <div className={`dataset-management-ui ${styles.datasetManagementUi}`}>
    <AppBar />
    {children}
    <NotificationList />
    <Modal />
  </div>;

App.propTypes = {
  children: PropTypes.element
};

export default App;
