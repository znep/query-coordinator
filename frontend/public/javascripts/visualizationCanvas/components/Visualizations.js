import _ from 'lodash';
import React, { PropTypes, PureComponent } from 'react';
import { connect } from 'react-redux';
import { components as SocrataVisualizations } from 'socrata-visualizations';
import EditVisualizationButton from './EditVisualizationButton';
import ShareVisualizationButton from './ShareVisualizationButton';

export class Visualizations extends PureComponent {
  render() {
    const { vifs, displayEditButtons, displayShareButtons } = this.props;

    if (_.isEmpty(vifs)) {
      return null;
    }

    const renderEditButton = (index) => {
      return displayEditButtons ?
        <EditVisualizationButton vifIndex={index} /> :
        null;
    };

    const renderShareButton = (index) => {
      return displayShareButtons ?
        <ShareVisualizationButton vifIndex={index} /> :
        null;
    };

    const visualizations = _.map(vifs, (vif, i) => (
      <div className="visualization-wrapper" key={i}>
        <div className="action-btns">
          {renderEditButton(i)}
          {renderShareButton(i)}
        </div>
        <SocrataVisualizations.Visualization vif={vif} />
      </div>
    ));

    return (
      <div className="visualizations">
        {visualizations}
      </div>
    );
  }
}

Visualizations.propTypes = {
  vifs: PropTypes.array.isRequired,
  displayEditButtons: PropTypes.bool
};

Visualizations.defaultProps = {
  displayEditButtons: false
};

function mapStateToProps(state) {
  return _.pick(state, 'vifs');
}

export default connect(mapStateToProps)(Visualizations);