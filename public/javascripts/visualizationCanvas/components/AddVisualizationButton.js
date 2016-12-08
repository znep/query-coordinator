import _ from 'lodash';
import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { addVisualization } from '../actions';
import { translate as t } from '../lib/I18n';

export const AddVisualizationButton = (props) => {
  const { openAuthoringWorkflowModal, vifs } = props;

  if (!_.isEmpty(vifs)) {
    return null;
  }

  return (
    <div className="add-visualization-button-container">
      <button
        className="btn btn-primary "
        onClick={openAuthoringWorkflowModal}>
        <span className="socrata-icon-add" role="presentation" />
        {t('add_visualization')}
      </button>
    </div>
  );
};

AddVisualizationButton.propTypes = {
  openAuthoringWorkflowModal: PropTypes.func.isRequired,
  vifs: PropTypes.array.isRequired
};

function mapStateToProps(state) {
  return _.pick(state, 'vifs');
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ openAuthoringWorkflowModal: addVisualization }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(AddVisualizationButton);
