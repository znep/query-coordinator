import _ from 'lodash';
import React, { PropTypes, PureComponent } from 'react';
import { connect } from 'react-redux';
import { components as SocrataVisualizations } from 'socrata-visualizations';
import EditVisualizationButton from './EditVisualizationButton';

/*
  Note: Make sure changes to "EditableVisualizations" are added to "Visualizations" as well.
  "EditableVisualizations" are "Visualizations" with an edit button
  Explanation:
  VisualizationCanvas has a concept of 'modes' which was introduced
  in order to avoid sprinkling components with conditional statements
  Given that visualizations can be in an editable state (with an edit button component),
  we introduced an "EditableVisualizations" component to stick to our design.
*/
export class EditableVisualizations extends PureComponent {
  render() {
    const { vifs } = this.props;

    if (_.isEmpty(vifs)) {
      return null;
    }

    const visualizations = _.map(vifs, (vif, i) => (
      <div className="visualization-wrapper" key={i}>
        <EditVisualizationButton vifIndex={i} />
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

EditableVisualizations.propTypes = {
  vifs: PropTypes.array.isRequired
};

function mapStateToProps(state) {
  return _.pick(state, 'vifs');
}

export default connect(mapStateToProps)(EditableVisualizations);
