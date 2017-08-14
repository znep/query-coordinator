import React, { PropTypes } from 'react';
import AppBar from 'containers/AppBarContainer';
import NotificationList from 'containers/NotificationListContainer';
import Modal from 'containers/ModalContainer';
import styles from './App.scss';

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
