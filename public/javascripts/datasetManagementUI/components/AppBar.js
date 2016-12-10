import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { EditBar } from 'socrata-components';

function AppBar({ name }) {
  return (
    <EditBar name={name} />
  );
}

AppBar.propTypes = {
  name: PropTypes.string.isRequired
};

function mapStateToProps(state) {
  return {
    name: state.db.views[0].name
  };
}

export default connect(mapStateToProps)(AppBar);
