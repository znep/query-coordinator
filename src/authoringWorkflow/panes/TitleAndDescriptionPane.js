import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

import { getCurrentVif } from '../selectors/vifAuthoring';
import { setTitle, setDescription } from '../actions';
import CustomizationTabPane from '../CustomizationTabPane';

export var TitleAndDescriptionPane = React.createClass({
  propTypes: {
    onChangeTitle: React.PropTypes.func,
    onChangeDescription: React.PropTypes.func
  },

  render: function() {
    return (
      <form>
        <label className="block-label">Title:</label>
        <input className="text-input" type="text" onChange={this.props.onChangeTitle} />
        <label className="block-label">Description:</label>
        <textarea className="text-input text-area" onChange={this.props.onChangeDescription}></textarea>
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
  function changeDatasetUid(datasetUid) {
    dispatch(setDatasetUid(datasetUid));
  }

  return {
    onChangeTitle: function(event) {
      var title = event.target.value;
      dispatch(setTitle(title));
    },

    onChangeDescription: function(event) {
      var description = event.target.value;
      dispatch(setDescription(description));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(TitleAndDescriptionPane);
