import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { openShareModal } from '../actions';
import { SocrataIcon } from 'common/components';

export class ShareVisualizationButton extends PureComponent {
  render() {
    const { onClickHandler, vifIndex } = this.props;

    return (
      <button
        className="share-visualization-button btn btn-alternate-2"
        onClick={() => onClickHandler(vifIndex)}>
        <SocrataIcon name="share" />
      </button>
    );
  }
}

ShareVisualizationButton.propTypes = {
  onClickHandler: PropTypes.func.isRequired,
  vifIndex: PropTypes.number.isRequired
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onClickHandler: (vifIndex) => openShareModal({ vifIndex })
  }, dispatch);
}

export default connect(_.stubObject, mapDispatchToProps)(ShareVisualizationButton);
