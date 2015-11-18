(function() {
  'use strict';

  function DiscoController($scope) {

    $scope.playlist = ['september.mp3', 'turn-the-beat-around.mp3', 'superstition.mp3'];
    $scope.songIndex = 0;

    $scope.toggleDisco = function() {
      $scope.discoLens.discoMode = !$scope.discoLens.discoMode;
      if ($scope.discoLens.discoMode) {
        // activate ze disco
        $scope.songChange();
      } else {
        // no more disco
        var tunes = $('#discoTunes')[0];
        tunes.pause();
        tunes.src = '';
      }
    };

    $scope.songChange = function() {
      if ($scope.songIndex >= $scope.playlist.length) {
        $scope.songIndex = 0;
      }

      var tunes = $('#discoTunes')[0];
      tunes.src = '/music/{0}'.format($scope.playlist[$scope.songIndex]);
      tunes.currentTime = 0;
      tunes.play();
      $scope.songIndex++;
    };
  }

  angular.
    module('dataCards.controllers').
    controller('DiscoController', DiscoController);

})();
