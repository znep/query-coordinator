var React = require('react');
var ReactDOM = require('react-dom');

var AuthoringWorkflow = React.createClass({
  propTypes: {
    vif: React.PropTypes.object,
    datasetUid: React.PropTypes.string,
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

        <button onClick={this.onComplete}>Done</button>
        <button onClick={this.onCancel}>Cancel</button>
      </div>
    );
  }
});

// Top-level API
module.exports = function(element, configuration) {
  var self = this;
  self.element = element;
  self.configuration = configuration;

  self.render = function() {
    ReactDOM.render(<AuthoringWorkflow {...configuration}/>, self.element);
  };

  self.destroy = function() {
    return ReactDOM.unmountComponentAtNode(self.element);
  };

  self.render();
};
