import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { editVisualization } from '../actions';
import { t } from '../lib/I18n';

export const EditVisualizationButton = (props) => {

  const { onClickHandler, vifIndex } = props;

  return (
    <button
      className="edit-visualization-button btn btn-primary"
      onClick={onClickHandler(vifIndex)}>
      {t('edit_visualization')}
    </button>
  );
};

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
