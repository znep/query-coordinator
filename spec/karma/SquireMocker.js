window.socrata.storyteller.SquireMocker = {

  mock: function() {
    var addEventListenerStub = sinon.stub();
    var Squire = function() {}
    Squire.prototype = {
      addEventListener: addEventListenerStub,
      getDocument: function() {
        return document.createDocumentFragment();
      },
      getHTML: function() {
        return '';
      },
      getSelection: function() {
        return {
          cloneContents: function() {
            return document.createElement('div');
          },
          commonAncestorContainer: document.createElement('div')
        };
      },
      hasFormat: function() {},
      setHTML: function() {}
    };
    window.Squire = Squire;
    window.Squire.stubs = {
      addEventListener: addEventListenerStub
    };
  },

  unmock: function() {
    delete window['Squire'];
  },

  // Invokes all handlers that have been registered for
  // the given eventName (see Squire's addEventListener API).
  invokeStubEvent: function(eventName) {
    // Look at addEventListener calls on the Squire stub to pull out
    // the event handlers.

    // Array of arguments to addEventListener. Form:
    // [
    //   [ eventName, handler ],
    //   [ eventName, handler ],
    //   ...
    // ]
    var allAddEventListenerArgs = Squire.stubs.addEventListener.args;

    _.chain(allAddEventListenerArgs).
      filter(function(singleCallArgs) { // Grab only addEventListener calls for eventName.
        return singleCallArgs[0] === eventName;
      }).
      pluck(1). // Grab the actual handler functions.
      invoke(_.call).value(); // Call 'em all (value() is needed to actually realize the chain).
  }

};
