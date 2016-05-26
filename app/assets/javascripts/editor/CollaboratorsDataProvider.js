import _ from 'lodash';

import Environment from '../StorytellerEnvironment';
import StorytellerUtils from '../StorytellerUtils';
import { storyStore } from './stores/StoryStore';
import httpRequest from '../services/httpRequest';
import { exceptionNotifier } from '../services/ExceptionNotifier';

/**
 * @class CollaboratorsDataProvider
 * @description
 * Provides a CRUD API for granting collaborators an access level.
 *
 * An access level is defined as a String equal to "owner", "contributor", or "viewer".
 */
export default function CollaboratorsDataProvider(storyUid) {
  StorytellerUtils.assert(
    /\w{4}\-\w{4}/.test(storyUid),
    'A valid story UID must be provided.'
  );

  var self = this;
  var uid = storyUid;
  var urls = {
    read: StorytellerUtils.format('/api/views/{0}/grants', uid),
    add: StorytellerUtils.format('/api/views/{0}/grants?accessType=WEBSITE', uid),
    remove: StorytellerUtils.format('/api/views/{0}/grants/i?accessType=WEBSITE&method=delete', uid)
  };

  /**
   * Public Methods
   */

  /**
   * @function getCollaborators
   * @description
   * Obtains a list of collaborators from the grants Core API endpoint.
   * Note: This adds the primary owner to collaborators.
   * @returns {Promise} - A promise that resolves with the Array of collaborators.
   */
  this.getCollaborators = function() {
    return new Promise(function(resolve, reject) {

      httpRequest('GET', urls.read, 'json').
        then(function(grants) {
          var promises;

          // Add the primary owner to the list of grants.
          grants = grants.concat({
            primary: true,
            userId: storyStore.getStoryPrimaryOwnerUid()
          });

          promises = _.chain(grants).
            filter(
              function(grant) {
                return grant.hasOwnProperty('userEmail') || grant.hasOwnProperty('userId');
              }
            ).
            map(getEmailAddress).
            value();

          Promise.all(promises).
            then(
              function(collaborators) {
                collaborators = _.map(collaborators, grantToStoreFormat);

                resolve(collaborators);
              },
              reject
            );
        }).
        catch(exceptionNotifier.notify);
    });
  };

  function getEmailAddress(collaborator) {
    var userUrl;

    if (collaborator.userEmail) {
      return Promise.resolve(collaborator);
    } else if (collaborator.userId) {

      userUrl = StorytellerUtils.format('/api/users/{0}.json', collaborator.userId);

      return httpRequest('GET', userUrl, 'json').
        then(
          function(json) {
            collaborator.userEmail = json.email;
            collaborator.displayName = json.displayName;
            collaborator.roleName = json.roleName || 'unknown';

            if (collaborator.primary) {
              collaborator.type = 'owner';
            } else if (!_.isString(collaborator.type)) {
              collaborator.type = 'unknown';
            }

            return collaborator;
          }
        ).
        catch(exceptionNotifier.notify);
    } else {
      return Promise.reject();
    }
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
          reject(
            StorytellerUtils.format('Could not find a collaborator with {0}', email)
          );
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
   * @function addCollaborators
   * @description
   * Adds collaborators to the current story's grant list with the specified access level.
   * These requests are sequential -- due to Core server's requirements and locking mechanism.
   *
   * @param {Array[Collaborator]} collaborators - A list of collaborators.
   * @param {Object} collaborator - A collaborator Object.
   * @param {String} collaborator.email - A valid email address.
   * @param {String} collaborator.accessLevel - A valid access level.
   * @returns {Promise} - A promise that resolves when an addition succeeds.
   */
  this.addCollaborators = function(collaborators) {
    return new Promise(function(resolve, reject) {
      var index = 0;
      var next = function() {
        if (!collaborators[index]) {
          return resolve(collaborators);
        }

        self.addCollaborator(collaborators[index++]).
          then(
            function() {
              next();
            }
          ).
          catch(
            function(error) {

              exceptionNotifier.notify(error);
              reject('Failed to save collaborator.');
            }
          );
      };

      next();
    });
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
        displayName: grant.displayName,
        roleName: grant.roleName,
        accessLevel: grant.type
      };
    } else {
      return {
        email: grant.userEmail,
        displayName: grant.displayName,
        roleName: grant.roleName,
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
      var json = Array.isArray(data) ? data.map(storeToGrantFormat) : storeToGrantFormat(data);
      var request = new XMLHttpRequest();
      var csrfToken = decodeURIComponent(
        StorytellerUtils.getCookie('socrata-csrf-token')
      );

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
      request.setRequestHeader('X-App-Token', Environment.CORE_SERVICE_APP_TOKEN);
      request.setRequestHeader('X-CSRF-Token', csrfToken);
      request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

      request.send(json);
    });
  }
}
