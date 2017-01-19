import React, { PropTypes } from 'react';
import AppBar from './AppBar';
import NotificationList from './NotificationList';

export default function App({ children }) {
  return (
    <div className="dataset-management-ui">
      <AppBar />
      {children}
      <NotificationList />
    </div>
  );
}

App.propTypes = {
  children: PropTypes.element
};
