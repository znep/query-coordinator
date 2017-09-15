import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import AuthoringWorkflow from 'common/authoring_workflow';
import {
  cancelEditingVisualization,
  updateVisualization
} from '../actions';

export class AuthoringWorkflowModal extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'createAuthoringWorkflow',
      'destroyAuthoringWorkflow'
    ]);
  }

  componentDidMount() {
    this.createAuthoringWorkflow();
  }

  componentDidUpdate() {
    this.createAuthoringWorkflow();
  }

  componentWillUnmount() {
    this.destroyAuthoringWorkflow();
  }

  createAuthoringWorkflow() {
    const { config, filters, onCancel, onComplete } = this.props;

    if (!config.isActive || this.authoringWorkflow || _.isEmpty(config.vif)) {
      return;
    }

    this.authoringWorkflow = new AuthoringWorkflow(this.authoringWorkflowContainer, {
      vif: config.vif,
      onCancel: _.flow(onCancel, this.destroyAuthoringWorkflow),
      onComplete: _.flow(onComplete, this.destroyAuthoringWorkflow),
      enableFiltering: true,
      filters,
      useLogger: _.get(window, 'serverConfig.environment') === 'development'
    });
  }

  destroyAuthoringWorkflow() {
    if (this.authoringWorkflow) {
      this.authoringWorkflow.destroy();
      this.authoringWorkflow = null;
    }
  }

  render() {
    const { config } = this.props;

    if (!config.isActive) {
      return null;
    }

    return (
      <div
        className="authoring-workflow-modal"
        ref={(container) => this.authoringWorkflowContainer = container} />
    );
  }
}

AuthoringWorkflowModal.propTypes = {
  config: PropTypes.shape({
    vifIndex: PropTypes.number,
    vif: PropTypes.object
  }).isRequired,
  filters: PropTypes.array.isRequired,
  onCancel: PropTypes.func,
  onComplete: PropTypes.func
};

AuthoringWorkflowModal.defaultProps = {
  onCancel: _.noop,
  onComplete: _.noop
};

function mapStateToProps(state) {
  return {
    config: state.authoringWorkflow,
    filters: state.filters
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onCancel: cancelEditingVisualization,
    onComplete: updateVisualization
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(AuthoringWorkflowModal);
