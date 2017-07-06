import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import { editVisualization } from '../actions';
import I18n from 'common/i18n';

export class EditVisualizationButton extends Component {
  render() {
    const { onClickHandler, vifIndex } = this.props;

    return (
      <button
        className="edit-visualization-button btn btn-alternate-2"
        onClick={onClickHandler(vifIndex)}>
        {I18n.t('visualization_canvas.edit_visualization')}
      </button>
    );
  }
}

EditVisualizationButton.propTypes = {
  onClickHandler: PropTypes.func.isRequired,
  vifIndex: PropTypes.number.isRequired
};

function mapDispatchToProps(dispatch) {
  return {
    onClickHandler(vifIndex) {
      const payload = {
        vifIndex: vifIndex
      };

      return () => dispatch(editVisualization(payload));
    }
  };
}

export default connect(_.stubObject, mapDispatchToProps)(EditVisualizationButton);
