(function() {
  'use strict';

  function ManageLensDialogSharingController($scope, $q, I18n, http) {
    var self = this;

    $scope.currentUserId = window.currentUser.id;

    // This function provides a description of the entity making the request to the http() service.
    // The requester object is expected present in the config options passed to http(), and it is expected
    // that the requester object expose a requesterLabel function that returns the descriptive string.
    self.requesterLabel = function() {
      return 'ManageLensDialogSharingController';
    };

    // Common share functions
    function formatShare(share) {
      var result = {
        userId: null,
        link: null,
        name: share.member_name,
        type: share.type.toLowerCase(),
        initialType: share.type.toLowerCase(),
        pendingRemoval: false
      };

      result.label = I18n.t('manageLensDialog.sharing.{0}'.format(result.type));

      if (share.member_id !== share.member_name) {
        result.userId = share.member_id;
        result.link = '/profile/{0}'.format(share.member_id);
      }

      return result;
    }

    var formatShares = _.partial(_.map, _, formatShare);

    // Shares
    function rejectInheritedShares(shares) {
      return _.reject(shares, 'inherited');
    }

    var shares$ = $scope.page.observe('shares').
      take(1).
      map(rejectInheritedShares).
      map(formatShares).
      map(function(shares) {
        var typePriorities = {
          owner: 0,
          contributor: 1,
          viewer: 2
        };

        return _.sortBy(shares, function(share) {
          return typePriorities[share.type];
        });
      });

    $scope.$bindObservable('shares', shares$);

    $scope.toggleSharePendingRemovalStatus = function(share) {
      share.pendingRemoval = !share.pendingRemoval;
    };

    $scope.disableSharingDropdown = function(share) {
      return share.pendingRemoval || $scope.currentUserId === share.userId;
    };

    $scope.disableRemoveButton = function(share) {
      return share.newShare || $scope.currentUserId === share.userId;
    };

    // Inherited shares
    function filterForInheritedShares(shares) {
      return _.filter(shares, 'inherited');
    }

    // Remove the new shares after save, since they have been added to the page shares
    function resetNewShares() {
      $scope.newShares.shares = [];
    }

    var inheritedShares$ = $scope.page.observe('shares').map(filterForInheritedShares);
    $scope.$bindObservable('showInheritedSharingSection', inheritedShares$.map(_.negate(_.isEmpty)));
    $scope.$bindObservable('inheritedShares', inheritedShares$.map(formatShares));

    var save = function() {
      var pageId = $scope.page.id;

      // Find all the shares that are pendingRemoval or had their type changed.
      // They will be deleted.
      var sharesToBeRemoved = _.filter($scope.shares, function(share) {
        return share.pendingRemoval || share.type !== share.initialType;
      });

      // Convert the condemned shares to promises that delete them.
      var removalPromises = _.map(sharesToBeRemoved, function(share) {
        var url = $.baseUrl('/api/views/{0}/grants/i'.format(pageId));
        url.searchParams.set('accessType', 'WEBSITE');
        url.searchParams.set('method', 'delete');

        var payload = {
          type: share.initialType
        };

        // If userId is present, then the share.name is the user's actual name,
        // otherwise it is an email address. Because of this, we need to prevent
        // sending the share.name in the payload as userEmail if the user has an ID.
        if (share.userId) {
          payload.userId = share.userId;
        } else {
          payload.userEmail = share.name;
        }

        return http.put(url.href, payload, { requester: self });
      });

      // Wait for all of the requests to complete, then figure out which
      // shares need to be added.
      return $q.all(removalPromises).then(function() {

        // Shares to be added are shares that had their type changed (but
        // are not pendingRemoval), or shares that were added using newShareDialog.
        var sharesToBeAdded = _.filter($scope.shares, function(share) {
          return share.pendingRemoval !== true && share.type !== share.initialType;
        });

        sharesToBeAdded = sharesToBeAdded.concat($scope.newShares.shares);

        // Map over them, converting into HTTP requests.
        var additionPromises = _.map(sharesToBeAdded, function(share) {
          var url = $.baseUrl('/api/views/{0}/grants/'.format(pageId));
          url.searchParams.set('accessType', 'WEBSITE');

          var payload = {
            type: share.type
          };

          if (share.userId) {
            payload.userId = share.userId;
          } else {
            payload.userEmail = share.name;
          }

          if (share.newShare) {
            payload.message = $scope.newShares.message;
          }

          return http.post(url.href, payload, { requester: self }).then(function(response) {
            var userId = response.data.userId;
            if (userId) {
              share.userId = userId;
            }
          });
        });

        // Return the promise to end all promises.
        return $q.all(additionPromises);
      });
    };

    var postSave = function() {
      var pageShares = _.clone($scope.page.getCurrentValue('shares'));

      // Remove shares that were removed.
      pageShares = _.reject(pageShares, function(share) {
        var modalShare = _.find($scope.shares, { name: share.member_name });

        if (modalShare) {
          return modalShare.pendingRemoval;
        }

        return false;
      });

      // Change the type of everything that had its type changed.
      var changedShares = _.filter($scope.shares, function(share) {
        return share.type !== share.initialType;
      });

      /* eslint-disable camelcase */
      _.each(changedShares, function(share) {
        var pageShare = _.find(pageShares, { member_name: share.name });
        if (pageShare) {
          pageShare.type = _.capitalize(share.type);
        }
      });

      // Add new shares to the page
      var newShares = $scope.newShares.shares;

      _.each(newShares, function(newShare) {
        var newShareConfig = {
          inherited: false,
          is_group: false,
          is_user: newShare.userId,
          member_name: newShare.name,
          member_id: newShare.userId || newShare.name,
          type: _.capitalize(newShare.type),
          user_member: null
        };

        if (!_.find(pageShares, newShareConfig)) {
          pageShares.push(newShareConfig);
        }
      });
      /* eslint-enable camelcase */

      $scope.page.set('shares', pageShares);
    };

    var postClose = function() {
      resetNewShares();
    };

    var deepShares$ = new Rx.BehaviorSubject();
    $scope.$watch('shares', function(shares) {
      deepShares$.onNext(shares);
    }, true);

    $scope.components.sharing = {
      save: save,
      postSave: postSave,
      postClose: postClose,
      hasChanges: false,
      hasErrors: false
    };

    Rx.Observable.subscribeLatest(
      $scope.$observe('newShares').pluck('shares'),
      deepShares$,
      function(newShares, shares) {
        $scope.components.sharing.hasChanges = !_.isEmpty(newShares) || _.some(shares, 'pendingRemoval') || _.some(shares, function(share) {
          return share.initialType !== share.type;
        });
      });
  }

  angular.
    module('dataCards.controllers').
    controller('ManageLensDialogSharingController', ManageLensDialogSharingController);

})();
