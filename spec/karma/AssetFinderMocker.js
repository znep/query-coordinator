(function() {
  'use strict';
  window.socrata.storyteller.AssetFinderMocker = {

    mock: function() {
      var AssetFinder = function() {};
      AssetFinder.prototype = {
        getStyleAssetPath: function() {
          return '';
        },
        getRelativeUrlRoot: function() {
          return '';
        }
      };
      window.socrata.storyteller.AssetFinder = AssetFinder;
    },

    unmock: function() {
      delete window.socrata.storyteller.AssetFinder;
    }

  };
})();
