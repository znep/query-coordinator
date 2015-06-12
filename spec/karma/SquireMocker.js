var SquireMocker = {

  mock: function() {
    var Squire = function() {}
    Squire.prototype = {
      addEventListener: function() {},
      setHTML: function() {},
      hasFormat: function() {},
      getSelection: function() {
        return {
          cloneContents: function() {
            return {
              childNodes: []
            }
          }
        };
      }
    };
    window.Squire = Squire;
  },

  unmock: function() {
    delete window['Squire'];
  }

};
