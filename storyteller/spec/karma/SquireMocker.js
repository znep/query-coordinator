import _ from 'lodash';
import sinon from 'sinon';

export default function() {
  var content = 'MOCKED BY SquireMocker';

  var addEventListenerStub = sinon.stub();

  this.addEventListener = addEventListenerStub;

  this.getDocument = function() {
    return document.createDocumentFragment();
  };

  this.getHTML = function() {
    return content;
  };

  this.getSelection = function() {
    return {
      cloneContents: function() {
        return document.createElement('div');
      },
      commonAncestorContainer: document.createElement('div')
    };
  };

  this.setKeyHandler = function() {};
  this.hasFormat = function() {};
  this.setHTML = function(newContent) { content = newContent; };
  this.__invokeEvent__ = function(eventName) {
    // Look at addEventListener calls on the Squire stub to pull out
    // the event handlers.

    // Array of arguments to addEventListener. Form:
    // [
    //   [ eventName, handler ],
    //   [ eventName, handler ],
    //   ...
    // ]
    var allAddEventListenerArgs = this.addEventListener.args;

    _.chain(allAddEventListenerArgs).
      filter(function(singleCallArgs) { // Grab only addEventListener calls for eventName.
        return singleCallArgs[0] === eventName;
      }).
      map(1). // Grab the actual handler functions.
      invokeMap(_.call).value(); // Call 'em all (value() is needed to actually realize the chain).
  };
}
