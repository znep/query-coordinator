import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import AddVisualizationButton from './AddVisualizationButton';
import AuthoringWorkflowModal from './AuthoringWorkflowModal';

export const VisualizationContainer = (props) => {
  const { vifs, isEditingVisualization } = props;

  const addVisualizationButton = _.isEmpty(vifs) ?
    <AddVisualizationButton /> :
    null;

  const visualizations = !_.isEmpty(vifs) ?
    _.map(vifs, (vif, i) => <code key={i}>{JSON.stringify(vif)}</code>) :
    null;

  const authoringWorkflowModal = isEditingVisualization ?
    <AuthoringWorkflowModal /> :
    null;

  return (
    <div className="visualization-container">
      {addVisualizationButton}
      {visualizations}
      {authoringWorkflowModal}
    </div>
  );
};

VisualizationContainer.propTypes = {
  vifs: PropTypes.array.isRequired,
  isEditingVisualization: PropTypes.bool.isRequired
};

function mapStateToProps(state) {
  return {
    vifs: state.vifs,
    isEditingVisualization: state.authoringWorkflow.isActive
  };
}

export default connect(mapStateToProps)(VisualizationContainer);
