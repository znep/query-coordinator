var AssetFinderMocker = {

  mock: function() {
    var AssetFinder = function() {}
    AssetFinder.prototype = {
      getStyleAssetPath: function(name) {
        return name + '.asset';
      },
      getRelativeUrlRoot: function() {
        return '';
      }
    };
    window.AssetFinder = AssetFinder;
  },

  unmock: function() {
    delete window['AssetFinder'];
  }

};
