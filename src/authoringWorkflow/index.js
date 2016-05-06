var React = require('react');
var ReactDOM = require('react-dom');
var AuthoringWorkflow = require('./AuthoringWorkflow');

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
