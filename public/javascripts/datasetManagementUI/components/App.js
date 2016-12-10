import React, { PropTypes } from 'react';
import AppBar from './AppBar';

export default function App({ children }) {
  return (
    <div className="dataset-management-ui">
      <AppBar />
      {children}
    </div>
  );
}

App.propTypes = {
  children: PropTypes.element
};
