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
  }

};
