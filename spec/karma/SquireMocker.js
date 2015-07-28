window.socrata.storyteller.SquireMocker = {

  mock: function() {
    var Squire = function() {}
    Squire.prototype = {
      addEventListener: function() {},
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
  },

  unmock: function() {
    delete window['Squire'];
  }

};
