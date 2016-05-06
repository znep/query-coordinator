var React = require('react');

var AuthoringWorkflow = React.createClass({
  propTypes: {
    vif: React.PropTypes.object,
    datasetMetadata: React.PropTypes.object
  },

  getInitialState: function() {
    return {
      vif: this.props.initialVif
    };
  },

  onComplete: function() {
    this.props.onComplete({
      vif: this.state.vif
    });
  },

  onCancel: function() {
    this.props.onCancel();
  },

  render: function() {
    return (
      <div>
        <div>This is a modal</div>

        <button className="done" onClick={this.onComplete}>Done</button>
        <button className="cancel" onClick={this.onCancel}>Cancel</button>
      </div>
    );
  }
});

module.exports = AuthoringWorkflow;
