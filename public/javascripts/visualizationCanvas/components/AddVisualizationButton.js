import _ from 'lodash';
import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { addVisualization } from '../actions';

export const AddVisualizationButton = (props) => {
  const { openAuthoringWorkflowModal } = props;

  return (
    <button className="btn btn-primary add-visualization" onClick={openAuthoringWorkflowModal}>
      <span className="socrata-icon-add" role="presentation" />
      {I18n.add_visualization}
    </button>
  );
};

AddVisualizationButton.propTypes = {
  openAuthoringWorkflowModal: PropTypes.func.isRequired
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ openAuthoringWorkflowModal: addVisualization }, dispatch);
}

export default connect(_.stubObject, mapDispatchToProps)(AddVisualizationButton);
