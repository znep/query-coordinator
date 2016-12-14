import _ from 'lodash';
import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { AuthoringWorkflow } from 'socrata-visualizations';
import {
  cancelEditingVisualization,
  updateVisualization
} from '../actions';

export const AuthoringWorkflowModal = React.createClass({
  propTypes: {
    config: PropTypes.shape({
      position: PropTypes.number.isRequired,
      vif: PropTypes.object.isRequired
    }).isRequired,
    onCancel: PropTypes.func,
    onComplete: PropTypes.func
  },

  getDefaultProps() {
    return {
      onCancel: _.noop,
      onComplete: _.noop
    };
  },

  componentDidMount() {
    const { config, onCancel, onComplete } = this.props;

    // don't initialize the AuthoringWorkflow if there isn't a VIF
    if (_.isEmpty(config.vif)) {
      return;
    }

    this.authoringWorkflow = new AuthoringWorkflow(this.authoringWorkflowContainer, {
      vif: config.vif,
      onCancel: _.flow(onCancel, this.destroyAuthoringWorkflow),
      onComplete: _.flow(onComplete, this.destroyAuthoringWorkflow),
      useLogger: _.get(window, 'serverConfig.environment') === 'development'
    });
  },

  destroyAuthoringWorkflow() {
    if (this.authoringWorkflow) {
      this.authoringWorkflow.destroy();
    }
  },

  componentWillUnMount() {
    this.destroyAuthoringWorkflow();
  },

  render() {
    return (
      <div
        className="authoring-workflow-modal"
        ref={(container) => this.authoringWorkflowContainer = container} />
    );
  }
});

function mapStateToProps(state) {
  return {
    config: state.authoringWorkflow
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      onCancel: cancelEditingVisualization,
      onComplete: updateVisualization
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(AuthoringWorkflowModal);