import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { components as SocrataVisualizations } from 'socrata-visualizations';

export const Visualizations = (props) => {
  const { vifs } = props;

  if (_.isEmpty(vifs)) {
    return null;
  }

  const visualizations = _.map(vifs, (vif, i) => (
    <SocrataVisualizations.Visualization key={i} vif={vif} />
  ));

  return (
    <div className="visualizations">
      {visualizations}
    </div>
  );
};

Visualizations.propTypes = {
  vifs: PropTypes.array.isRequired
};

function mapStateToProps(state) {
  return _.pick(state, 'vifs');
}

export default connect(mapStateToProps)(Visualizations);
