import React, { PropTypes } from 'react';
import AppBar from './AppBar';
import NotificationList from './NotificationList';
import styles from 'styles/App.scss';

const classNames = `dataset-management-ui ${styles.datasetManagementUi}`;

const App = ({ children }) =>
  <div className={classNames}>
    <AppBar />
    {children}
    <NotificationList />
  </div>;

App.propTypes = {
  children: PropTypes.element
};

export default App;
