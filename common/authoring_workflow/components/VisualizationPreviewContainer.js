import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { SocrataIcon } from 'common/components';

import VisualizationPreview from './VisualizationPreview';
import I18n from 'common/i18n';
import { setMapInfoDismissed } from '../actions';
import { hasVisualizationType, hasVisualizationDimension, isRenderableMap } from '../selectors/vifAuthoring';

export class VisualizationPreviewContainer extends Component {

  constructor(props) {
    super(props);

    _.bindAll(this, ['onDismissMapInfo']);
  }

  renderGetStartedMessage() {
    const { vifAuthoring } = this.props;
    const hasType = hasVisualizationType(vifAuthoring);
    const hasDimension = hasVisualizationDimension(vifAuthoring);

    return hasType && hasDimension ?
      null :
      (
        <div className="get-started-container">
          <h5 className="get-started-title">{I18n.t('shared.visualizations.preview.get_started.title')}</h5>
          <p className="get-started-description">{I18n.t('shared.visualizations.preview.get_started.description')}</p>
        </div>
      );
  }

  onDismissMapInfo() {
    this.props.dismissMapInfo();
  }

  renderMapInfo() {
    const { vifAuthoring } = this.props;

    if (!vifAuthoring.authoring.mapInfoDismissed && isRenderableMap(vifAuthoring)) {
      return (
        <div className="visualization-preview-map-info-container">
          <div className="visualization-preview-map-message alert info">
            <small className="visualization-preview-map-text">{I18n.t('shared.visualizations.preview.center_and_zoom')}</small>
            <button className="visualization-preview-map-text-dismiss btn btn-transparent" onClick={this.onDismissMapInfo}>
              <SocrataIcon name="close-2" />
            </button>
          </div>
        </div>
      );
    }
  }

  render() {
    return (
      <div className="visualization-preview-container">
        {this.renderGetStartedMessage()}
        <VisualizationPreview />
        {this.renderMapInfo()}
      </div>
    );
  }
}

VisualizationPreviewContainer.propTypes = {
  vifAuthoring: PropTypes.object,
  dismissMapInfo: PropTypes.func.isRequired
};

function mapStateToProps({ vifAuthoring }) {
  return { vifAuthoring };
}

function mapDispatchToProps(dispatch) {
  return {
    dismissMapInfo() {
      dispatch(setMapInfoDismissed());
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(VisualizationPreviewContainer);
