import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { addVisualization } from '../actions';
import I18n from 'common/i18n';

export class AddVisualizationButton extends Component {
  render() {
    const { onClickHandler, hasVisualization } = this.props;

    return (
      <div className="add-visualization-button-container">
        <button
          className="btn btn-primary"
          onClick={onClickHandler}
          disabled={hasVisualization}>
          <span className="socrata-icon-add" role="presentation" />
          {I18n.t('visualization_canvas.add_visualization')}
        </button>
      </div>
    );
  }
}

AddVisualizationButton.propTypes = {
  onClickHandler: PropTypes.func.isRequired,
  hasVisualization: PropTypes.bool.isRequired
};

function mapStateToProps(state) {
  return {
    hasVisualization: !_.isEmpty(state.vifs)
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ onClickHandler: addVisualization }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(AddVisualizationButton);
