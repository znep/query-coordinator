window.socrata.storyteller.AssetFinderMocker = {

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
    window.socrata.storyteller.AssetFinder = AssetFinder;
  },

  unmock: function() {
    delete window.socrata.storyteller['AssetFinder'];
  }

};
