import React from 'react';
import { connect } from 'react-redux';

import CustomizationTabPane from '../CustomizationTabPane';

export var FlyoutsPane = React.createClass({
  render: function() {
    return (
      <form>
        <label className="block-label">Label:</label>
        <input className="text-input" type="text" onChange={this.props.onChangeLabel} />
      </form>
    );
  }
});

export default FlyoutsPane;
