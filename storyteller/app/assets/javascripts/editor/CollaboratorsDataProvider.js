import _ from 'lodash';

import Environment from '../StorytellerEnvironment';
import StorytellerUtils from '../StorytellerUtils';
import { assert } from 'common/js_utils';
import { storyStore } from './stores/StoryStore';
import httpRequest, { coreHeaders } from '../services/httpRequest';
import { exceptionNotifier } from '../services/ExceptionNotifier';

/**
 * @class CollaboratorsDataProvider
 * @description
 * Provides a CRUD API for granting collaborators an access level.
 *
 * An access level is defined as a String equal to "owner", "contributor", or "viewer".
 */
export default function CollaboratorsDataProvider() {

  var uid = Environment.STORY_UID;
  assert(
    /\w{4}\-\w{4}/.test(uid),
    'A valid story UID must be provided.'
  );

  var self = this;
  var urls = {
    read: StorytellerUtils.format('/api/views/{0}/grants', uid),
    add: StorytellerUtils.format('/api/views/{0}/grants?accessType=WEBSITE', uid),
    remove: StorytellerUtils.format('/api/views/{0}/grants/i?accessType=WEBSITE&method=delete', uid)
  };

  /**
   * Public Methods
   */

  /**
   * Looks up a user object via email.
   * Returns null if the user is not found or there is an
   * error.
   */
  this.doesUserWithEmailHaveStoriesRights = function(email) {
    const userUrl = `/stories/search/users/hasStoriesRights?email=${email}`;

    return httpRequest('GET', userUrl).then(
      ({ data }) => data,
      (error) => {
        exceptionNotifier.notify(error);
        return null;
      }
    );
  };

  /**
   * @function getCollaborators
   * @description
   * Obtains a list of collaborators from the grants Core API endpoint.
   * Note: This adds the primary owner to collaborators.
   * @returns {Promise} - A promise that resolves with the Array of collaborators.
   */
  this.getCollaborators = function() {
    return httpRequest('GET', urls.read).
      then(({ data }) => {
        // Add the primary owner to the list of grants.
        const grants = data.concat({
          primary: true,
          userId: storyStore.getStoryPrimaryOwnerUid()
        });

        const promises = _.chain(grants).
          filter((grant) => {
            return grant.hasOwnProperty('userEmail') || grant.hasOwnProperty('userId');
          }).
          map(getEmailAddress).
          value();

        return Promise.all(promises);
      }).
      then((collaborators) => _.map(collaborators, grantToStoreFormat)).
      catch(exceptionNotifier.notify);
  };

  function getEmailAddress(collaborator) {
    if (collaborator.userEmail) {
      return Promise.resolve(collaborator);
    } else if (collaborator.userId) {

      const userUrl = StorytellerUtils.format('/api/users/{0}.json', collaborator.userId);

      return httpRequest('GET', userUrl).
        then((response) => {
          const user = response.data;
          collaborator.userEmail = user.email;
          collaborator.displayName = user.displayName;
          collaborator.roleName = user.roleName || 'unknown';

          if (collaborator.primary) {
            collaborator.type = 'owner';
          } else if (!_.isString(collaborator.type)) {
            collaborator.type = 'unknown';
          }

          return collaborator;
        }).
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
      const collaborator = _.find(collaborators, { email });

      if (collaborator) {
        return collaborator;
      } else {
        return Promise.reject(StorytellerUtils.format('Could not find a collaborator with {0}', email));
      }
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
    return httpRequest('POST', urls.add, {
      data: storeToGrantFormat(collaborator),
      headers: coreHeaders()
    });
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
    const collabs = _.cloneDeep(collaborators);

    const addNext = () => {
      const collab = collabs.shift();
      if (collab) {
        return self.addCollaborator(collab).then(addNext);
      } else {
        return Promise.resolve(collaborators);
      }
    };

    return addNext().catch((error) => {
      exceptionNotifier.notify(error);
      return Promise.reject('Failed to save collaborator.');
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
        return httpRequest('PUT', urls.remove, {
          data: storeToGrantFormat(originalCollaborator),
          headers: coreHeaders()
        });
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
}
