import React from 'react';
import { connect } from 'react-redux';

import { getCurrentVif } from '../selectors/vifAuthoring';
import CustomizationTabPane from '../CustomizationTabPane';
import { setPrimaryColor, setSecondaryColor, setHighlightColor } from '../actions';

export var ColorsAndStylePane = React.createClass({
  render: function() {
    return (
      <form>
        <label className="block-label">Primary Color:</label>
        <input name="primary-color" className="text-input" type="text" onChange={this.props.onChangePrimaryColor} />
        <label className="block-label">Secondary Color:</label>
        <input name="secondary-color" className="text-input" type="text" onChange={this.props.onChangeSecondaryColor} />
        <label className="block-label">Highlight Color:</label>
        <input name="highlight-color" className="text-input" type="text" onChange={this.props.onChangeHighlightColor} />
      </form>
    );
  }
});

function mapStateToProps(state) {
  return {
    vif: getCurrentVif(state.vifAuthoring),
    datasetMetadata: state.datasetMetadata
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onChangePrimaryColor: function(event) {
      var primaryColor = event.target.value;
      dispatch(setPrimaryColor(primaryColor));
    },

    onChangeSecondaryColor: function(event) {
      var secondaryColor = event.target.value;
      dispatch(setSecondaryColor(secondaryColor));
    },

    onChangeHighlightColor: function(event) {
      var highlightColor = event.target.value;
      dispatch(setHighlightColor(highlightColor));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ColorsAndStylePane);
