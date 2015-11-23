(function() {
  'use strict';

  var socrata = window.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  /**
   * @class CollaboratorsDataProvider
   * @description
   * Provides a CRUD API for granting collaborators an access level.
   *
   * An access level is defined as a String equal to "owner", "contributor", or "viewer".
   */
  function CollaboratorsDataProvider(storyUid) {
    utils.assert(
      /\w{4}\-\w{4}/.test(storyUid),
      'A valid story UID must be provided.'
    );

    var self = this;
    var uid = storyUid;
    var urls = {
      read: '/api/views/{0}/grants'.format(uid),
      add: '/api/views/{0}/grants?accessType=WEBSITE'.format(uid),
      remove: '/api/views/{0}/grants/i?accessType=WEBSITE&method=delete'.format(uid)
    };

    /**
     * Public Methods
     */

    /**
     * @function getCollaborators
     * @description
     * Obtains a list of collaborators from the grants Core API endpoint.
     * @returns {Promise} - A promise that resolves with the Array of collaborators.
     */
    this.getCollaborators = function() {
      return new Promise(function(resolve, reject) {
        $.getJSON(urls.read).
          then(function(grants) {
            var promises = _.chain(grants).
              filter(function(grant) {
                return grant.hasOwnProperty('userEmail') || grant.hasOwnProperty('userId');
              }).
              map(getEmailAddress).
              value();

            Promise.all(promises).
              then(function(collaborators) {
                collaborators = _.map(collaborators, grantToStoreFormat);
                resolve(collaborators);
              }, reject);
          }, reject);
      });
    };

    function getEmailAddress(collaborator) {
      return new Promise(function(resolve, reject) {
        if (collaborator.userEmail) {
          resolve(collaborator);
        } else if (collaborator.userId) {
          $.ajax({
            url: '/api/users/{0}.json'.format(collaborator.userId),
            dataType: 'json',
            success: function(json) {
              collaborator.userEmail = json.email;
              resolve(collaborator);
            },
            error: reject
          });
        } else {
          reject();
        }
      });
    }

    /**
     * @function getCollaborator
     * @description
     * Obtains a single collaborator based on an email address.
     * @param {String} email - A valid email address.
     * @returns {Promise} - A promise that resolve with a single collaborator.
     */
    this.getCollaborator = function(email) {
      return this.getCollaborators().then(function(collaborators) {
        return new Promise(function(resolve, reject) {
          var collaborator = _.find(collaborators, function(originalCollaborator) {
            return originalCollaborator.email === email;
          });

          if (collaborator) {
            resolve(collaborator);
          } else {
            reject('Could not find a collaborator with {0}'.format(email));
          }
        });
      });
    };

    /**
     * @function changeCollaborator
     * @description
     * Changes a collaborator from the original collaborator to a collaborator passed to the function.
     * This is a two-step process, where the original collaborator is deleted, and the new collaborator
     * is added.
     * @param {Object} collaborator - A collaborator Object.
     * @param {String} collaborator.email - A valid email address.
     * @param {String} collaborator.accessLevel - A valid access level.
     * @returns {Promise} - A promise that resolves when both removal and additions succeed.
     */
    this.changeCollaborator = function(collaborator) {
      return self.getCollaborator(collaborator.email).
        then(self.removeCollaborator).
        then(function() {
          return self.addCollaborator(collaborator);
        });
    };

    /**
     * @function addCollaborator
     * @description
     * Adds a collaborator to the current story's grant list with the specified access level.
     * @param {Object} collaborator - A collaborator Object.
     * @param {String} collaborator.email - A valid email address.
     * @param {String} collaborator.accessLevel - A valid access level.
     * @returns {Promise} - A promise that resolves when an addition succeeds.
     */
    this.addCollaborator = function(collaborator) {
      return ajax('post', urls.add, collaborator);
    };

    /**
     * @function removeCollaborator
     * @description
     * Removes a collaborator from the current story's grant list.
     * @param {Object} collaborator - A collaborator Object.
     * @param {String} collaborator.email - A valid email address.
     * @param {String} collaborator.accessLevel - A valid access level.
     * @returns {Promise} - A promise that resolves when a removal succeeds.
     */
    this.removeCollaborator = function(collaborator) {
      return self.getCollaborator(collaborator.email).
        then(function(originalCollaborator) {
          return ajax('put', urls.remove, originalCollaborator);
        });
    };

    /**
     * Private Methods
     */

    function grantToStoreFormat(grant) {
      if (grant.userId) {
        return {
          uid: grant.userId,
          email: grant.userEmail,
          accessLevel: grant.type
        };
      } else {
        return {
          email: grant.userEmail,
          accessLevel: grant.type
        };
      }
    }

    function storeToGrantFormat(store) {
      if (store.uid) {
        return {
          userId: store.uid,
          type: store.accessLevel
        };
      } else {
        return {
          userEmail: store.email,
          type: store.accessLevel
        };
      }
    }

    function ajax(method, url, data) {
      return new Promise(function(resolve, reject) {
        var json = storeToGrantFormat(data);
        var request = new XMLHttpRequest();

        json = JSON.stringify(json);

        request.addEventListener('load', function() {
          var isAString = typeof this.responseText === 'string';
          var hasALength = this.responseText.length > 0;
          var isJSON = /application\/json/.test(this.getResponseHeader('Content-Type'));

          if (this.status === 200) {
            if (isAString && hasALength && isJSON) {
              resolve(JSON.parse(this.responseText));
            } else {
              resolve();
            }
          } else {
            reject(this);
          }
        });

        request.open(method, url);
        request.setRequestHeader('Content-Type', 'application/json');

        request.send(json);
      });
    }
  }

  storyteller.CollaboratorsDataProvider = CollaboratorsDataProvider;
})();
