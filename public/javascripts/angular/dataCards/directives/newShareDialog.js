(function() {
  'use strict';

  function newShareDialog($window) {
    return {
      restrict: 'E',
      scope: {
        dialogState: '=',
        saveNewShares: '='
      },
      templateUrl: '/angular_templates/dataCards/new-share-dialog.html',
      link: function($scope) {

        function createNewFormattedShare() {
          return {
            newShare: true,
            link: null,
            name: '',
            type: 'viewer',
            pendingRemoval: false
          };
        }

        $scope.newShares = _.cloneDeep($scope.$parent.newShares);
        if (_.isEmpty($scope.newShares.shares)) {
          $scope.newShares.shares = [createNewFormattedShare()];
        }

        $scope.addNewShare = function() {
          $scope.newShares.shares.push(createNewFormattedShare());
        };

        $scope.multipleNewShares = function() {
          return $scope.newShares.shares.length > 1;
        };

        $scope.removeNewShare = function(share) {
          if ($scope.multipleNewShares()) {
            var index = $scope.newShares.shares.indexOf(share);
            $scope.newShares.shares.splice(index, 1);
          }
        };

        //                    /~
        //              \  \ /**
        //               \ ////
        //               // //
        //              // //
        //            ///&//
        //           / & /\ \
        //         /  & .,,  \
        //       /& %  :       \
        //     /&  %   :  ;     `\
        //    /&' &..%   !..    `.\
        //   /&' : &''" !  ``. : `.\
        //  /#' % :  "" * .   : : `.\
        // I# :& :  !"  *  `.  : ::  I
        // I &% : : !%.` '. . : : :  I
        // I && :%: .&.   . . : :  : I
        // I %&&&%%: WW. .%. : :     I
        //  \&&&##%%%`W! & '  :   ,'/
        //   \####ITO%% W &..'  #,'/
        //     \W&&##%%&&&&### %./
        //       \###j[\##//##}/
        //          ++///~~\//_
        //           \\ \ \ \  \_
        //           /  /    \
        $scope.donions = function() {
          var cleanNewShares = {};

          // Filter newShares.shares that don't have a valid email
          cleanNewShares.shares = _.filter($scope.newShares.shares, _.property('name'));

          // Filter out the current user's email (they can't share it with themselves)
          var currentUserEmail = _.get($window.currentUser, 'email', '');
          cleanNewShares.shares = _.reject(cleanNewShares.shares, 'name', currentUserEmail);

          // Sanitize optional message
          cleanNewShares.message = _.escape($scope.newShares.message);
          $scope.saveNewShares(cleanNewShares);
          $scope.dialogState.show = false;
        };
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('newShareDialog', newShareDialog);

})();
