import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

function AppBar({ name }) {
  return (
    <nav className="app-navbar">
      <button
        data-panel-toggle="settings-panel"
        className="icon-stories-menu settings-panel-btn"></button>
      <span className="dataset-name">{name}</span>
    </nav>
  );
}

AppBar.propTypes = {
  name: PropTypes.string.isRequired
};

function mapStateToProps(state) {
  return {
    name: state.metadata.name
  };
}

export default connect(mapStateToProps)(AppBar);
