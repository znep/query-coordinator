import React from 'react';
import { connect } from 'react-redux';

import CustomizationTabPane from '../CustomizationTabPane';

export var AxisAndScalePane = React.createClass({
  render: function() {
    return (
      <form>
        <h2>Scale</h2>
        <label className="block-label">Type:</label>
        <select>
          <option>Time</option>
          <option>Quantitative</option>
          <option>Ordinal</option>
        </select>
        <h4>X-Axis Units</h4>
        <label className="block-label">One:</label>
        <input className="text-input" type="text" onChange={this.props.onChangeXAxisUnitOne} />
        <label className="block-label">Other:</label>
        <input className="text-input" type="text" onChange={this.props.onChangeXAxisUnitOther} />
      </form>
    );
  }
});

function mapStateToProps(state) {
  return {
    vif: state.vif,
    datasetMetadata: state.datasetMetadata
  };
}

function mapDispatchToProps(dispatch) {
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(AxisAndScalePane);
