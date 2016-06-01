import React from 'react';
import { connect } from 'react-redux';

import CustomizationTabPane from '../CustomizationTabPane';

export var LabelsPane = React.createClass({
  render: function() {
    return (
      <form>
        <label className="block-label">One:</label>
        <input className="text-input" type="text" onChange={this.props.onChangeSeriesOne} />
        <label className="block-label">Other:</label>
        <input className="text-input" type="text" onChange={this.props.onChangeSeriesOther} />
      </form>
    );
  }
});

export default LabelsPane;
