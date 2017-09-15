import $ from 'jquery';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { components as SocrataVisualizations } from 'common/visualizations';
import { SocrataIcon } from 'common/components';
import I18n from 'common/i18n';
import EditVisualizationButton from './EditVisualizationButton';
import ShareVisualizationButton from './ShareVisualizationButton';

export class VisualizationWrapper extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'onMapCenterAndZoomChange',
      'onMapNotificationDismiss'
    ]);
  }

  componentDidMount() {
    $(this.visualization).
      on('SOCRATA_VISUALIZATION_MAP_CENTER_AND_ZOOM_CHANGED', this.onMapCenterAndZoomChange);
  }

  componentWillUnmount() {
    $(this.visualization).
      off('SOCRATA_VISUALIZATION_MAP_CENTER_AND_ZOOM_CHANGED', this.onMapCenterAndZoomChange);
  }

  onMapCenterAndZoomChange(event) {
    const { isEditable, vif, vifIndex, onMapCenterAndZoomChange } = this.props;
    const centerAndZoom = event.originalEvent.detail;
    const vifCenterAndZoom = _.get(vif, 'configuration.mapCenterAndZoom');

    // only update the VIF if the visualization is editable and the center/zoom has changed
    if (isEditable && !_.isEqual(vifCenterAndZoom, centerAndZoom)) {
      onMapCenterAndZoomChange({
        centerAndZoom,
        vifIndex
      });
    }
  }

  onMapNotificationDismiss() {
    const { vifIndex, onMapNotificationDismiss } = this.props;

    onMapNotificationDismiss({ vifIndex });
  }

  // If we want to add more notifications, we should generalize the map notifications to handle
  // multiple kinds of notifications, rather than repeating this pattern for another kind of
  // notification!
  renderMapNotification() {
    const { vif, isEditable, mapNotificationDismissed } = this.props;
    const isMap = _.includes(['featureMap', 'regionMap'], _.get(vif, 'series[0].type'));

    return isMap && isEditable && !mapNotificationDismissed ?
      <div className="visualization-notification-container">
        <div className="alert info visualization-notification-message">
          <small className="visualization-notification-text">
            {I18n.t('visualization_canvas.map_pan_and_zoom_message')}
          </small>
          <button
            className="btn btn-transparent visualization-notification-dismiss"
            onClick={this.onMapNotificationDismiss}>
            <SocrataIcon name="close-2" />
          </button>
        </div>
      </div> :
      null;
  }

  render() {
    const { vifIndex, vif, isEditable, displayShareButton } = this.props;

    if (_.isEmpty(vif)) {
      return null;
    }

    const editButton = isEditable ?
      <EditVisualizationButton vifIndex={vifIndex} /> :
      null;

    const shareButton = displayShareButton ?
      <ShareVisualizationButton vifIndex={vifIndex} /> :
      null;

    return (
      <div className="visualization-wrapper" ref={(ref) => this.visualization = ref}>
        <div className="action-btns">
          {editButton}
          {shareButton}
        </div>
        <SocrataVisualizations.Visualization vif={vif} />
        {this.renderMapNotification()}
      </div>
    );
  }
}

VisualizationWrapper.propTypes = {
  vif: PropTypes.object.isRequired,
  vifIndex: PropTypes.number.isRequired,
  isEditable: PropTypes.bool,
  mapNotificationDismissed: PropTypes.bool,
  displayShareButton: PropTypes.bool,
  onMapCenterAndZoomChange: PropTypes.func,
  onMapNotificationDismiss: PropTypes.func
};

VisualizationWrapper.defaultProps = {
  isEditable: false,
  mapNotificationDismissed: false,
  displayShareButton: false,
  onMapCenterAndZoomChange: _.noop,
  onMapNotificationDismiss: _.noop
};

export default VisualizationWrapper;
