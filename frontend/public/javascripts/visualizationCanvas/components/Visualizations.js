import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import VisualizationWrapper from './VisualizationWrapper';
import {
  setMapCenterAndZoom,
  setMapNotificationDismissed
} from '../actions';

export class Visualizations extends Component {
  render() {
    const {
      vifs,
      displayShareButtons,
      isEditable,
      mapNotificationDismissed,
      onMapCenterAndZoomChange,
      onMapNotificationDismiss
    } = this.props;

    if (_.isEmpty(vifs)) {
      return null;
    }

    const visualizations = _.map(vifs, (vif, vifIndex) => {
      const props = {
        key: vifIndex,
        vif,
        vifIndex,
        isEditable,
        mapNotificationDismissed: mapNotificationDismissed[vifIndex],
        displayShareButton: displayShareButtons,
        onMapCenterAndZoomChange,
        onMapNotificationDismiss
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
  onMapNotificationDismiss: PropTypes.func
};

Visualizations.defaultProps = {
  isEditable: false,
  displayShareButtons: false,
  mapNotificationDismissed: [],
  onMapCenterAndZoomChange: _.noop,
  onMapNotificationDismiss: _.noop
};

function mapStateToProps(state) {
  return _.cloneDeep(_.pick(state, 'vifs', 'mapNotificationDismissed'));
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onMapCenterAndZoomChange: setMapCenterAndZoom,
    onMapNotificationDismiss: setMapNotificationDismissed
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Visualizations);
