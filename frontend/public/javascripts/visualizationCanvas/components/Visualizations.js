import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import VisualizationWrapper from './VisualizationWrapper';
import {
  setMapCenterAndZoom,
  setMapNotificationDismissed,
  setMapPitchAndBearing
} from '../actions';

export class Visualizations extends Component {
  render() {
    const {
      vifs,
      displayShareButtons,
      isEditable,
      mapNotificationDismissed,
      onMapCenterAndZoomChange,
      onMapNotificationDismiss,
      onMapPitchAndBearingChange
    } = this.props;

    if (_.isEmpty(vifs)) {
      return null;
    }

    const visualizations = _.map(vifs, (vif, vifIndex) => {
      // EN-22002 - including the `origin` (which includes `url`) will render the "View source data" link
      // as a link to this viz-canvas. We remove it so that it defaults to pointing to the underlying dataset.
      vif = _.omit(vif, 'origin');

      const props = {
        key: vifIndex,
        vif,
        vifIndex,
        isEditable,
        mapNotificationDismissed: mapNotificationDismissed[vifIndex],
        displayShareButton: displayShareButtons,
        onMapCenterAndZoomChange,
        onMapNotificationDismiss,
        onMapPitchAndBearingChange
      };

      return <VisualizationWrapper {...props} />;
    });

    return (
      <div className="visualizations">
        {visualizations}
      </div>
    );
  }
}

Visualizations.propTypes = {
  vifs: PropTypes.array.isRequired,
  isEditable: PropTypes.bool,
  displayShareButtons: PropTypes.bool,
  mapNotificationDismissed: PropTypes.array,
  onMapCenterAndZoomChange: PropTypes.func,
  onMapNotificationDismiss: PropTypes.func,
  onMapPitchAndBearingChange: PropTypes.func
};

Visualizations.defaultProps = {
  isEditable: false,
  displayShareButtons: false,
  mapNotificationDismissed: [],
  onMapCenterAndZoomChange: _.noop,
  onMapNotificationDismiss: _.noop,
  onMapPitchAndBearingChange: _.noop
};

function mapStateToProps(state) {
  return _.cloneDeep(_.pick(state, 'vifs', 'mapNotificationDismissed'));
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onMapCenterAndZoomChange: setMapCenterAndZoom,
    onMapNotificationDismiss: setMapNotificationDismissed,
    onMapPitchAndBearingChange: setMapPitchAndBearing
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Visualizations);
