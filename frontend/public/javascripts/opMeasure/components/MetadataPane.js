import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

// Pane containing generic asset metadata for the measure.
export class MetadataPane extends Component {
  render() {
    const { activePane } = this.props;
    if (activePane !== 'metadata') {
      return null;
    }

    return (
      <div className="pane" data-pane="metadata">
        <p>Hey, here is some metadata</p>
      </div>
    );
  }
}

MetadataPane.propTypes = {
  activePane: PropTypes.string
};

function mapStateToProps(state) {
  return state.view;
}

export default connect(mapStateToProps)(MetadataPane);
