import React, { Component } from 'react';
import { connect } from 'react-redux';

// Configuration panel for... something TBD.
export class GeneralPanel extends Component {
  render() {
    return (
      <span>Are we setting title and description here?</span>
    );
  }
}

export default connect()(GeneralPanel);
