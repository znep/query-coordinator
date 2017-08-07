import _ from 'lodash';
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

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
  activePane: PropTypes.string.isRequired
};

function mapStateToProps(state) {
  return _.pick(state, 'activePane');
}

export default connect(mapStateToProps)(MetadataPane);
