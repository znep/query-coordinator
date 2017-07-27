import React, { PropTypes } from 'react';
import AppBar from './AppBar';
import NotificationList from 'components/Notifications/NotificationList';
import Modal from 'components/Modals/Modal';
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
