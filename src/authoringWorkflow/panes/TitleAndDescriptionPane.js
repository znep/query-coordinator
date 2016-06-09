import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

import { INPUT_DEBOUNCE_MILLISECONDS } from '../constants';
import { getTitle, getDescription } from '../selectors/vifAuthoring';
import { setTitle, setDescription } from '../actions';
import CustomizationTabPane from '../CustomizationTabPane';

export var TitleAndDescriptionPane = React.createClass({
  propTypes: {
    onChangeTitle: React.PropTypes.func,
    onChangeDescription: React.PropTypes.func
  },

  render() {
    var title = getTitle(this.props.vifAuthoring) || null;
    var description = getDescription(this.props.vifAuthoring) || null;

    return (
      <form>
        <label className="block-label" htmlFor="title">Title:</label>
        <input id="title" className="text-input" type="text" onChange={this.props.onChangeTitle} defaultValue={title} />
        <label className="block-label" htmlFor="description">Description:</label>
        <textarea id="description" className="text-input text-area" onChange={this.props.onChangeDescription} defaultValue={description} />
      </form>
    );
  }
});

function mapStateToProps(state) {
  return {
    vifAuthoring: state.vifAuthoring
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onChangeTitle: _.debounce(event => {
      var title = event.target.value;
      dispatch(setTitle(title));
    }, INPUT_DEBOUNCE_MILLISECONDS),

    onChangeDescription: _.debounce(event => {
      var description = event.target.value;
      dispatch(setDescription(description));
    }, INPUT_DEBOUNCE_MILLISECONDS)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(TitleAndDescriptionPane);
