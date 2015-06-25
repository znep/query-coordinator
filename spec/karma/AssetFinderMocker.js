var AssetFinderMocker = {

  mock: function() {
    var AssetFinder = function() {}
    AssetFinder.prototype = {
      getStyleAssetPath: function(name) {
        return name + '.asset';
      }
    };
    window.AssetFinder = AssetFinder;
  },

  unmock: function() {
    delete window['AssetFinder'];
  }

};
